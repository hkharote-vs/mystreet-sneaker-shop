import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert, Package, Upload, Download } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { PRODUCT_KEYS } from '@/features/products/hooks/useProducts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ProductFormModal } from '@/components/admin/ProductFormModal'
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useDeleteProduct } from '../hooks/useAdminProducts'
import { toast } from '@/components/ui/use-toast'
import type { ProductDetail, ProductSummary } from '@/types'

export default function AdminProductsPage() {
  const { data: products, isLoading } = useProducts()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const result = await productsApi.importCsv(file)
      const parts: string[] = []
      if (result.inserted > 0) parts.push(`${result.inserted} added`)
      if (result.updated  > 0) parts.push(`${result.updated} updated`)
      if (result.skipped  > 0) parts.push(`${result.skipped} skipped`)
      toast({
        title: 'Import complete',
        description: parts.join(' · ') || 'No changes',
      })
      if (result.errors.length > 0) {
        toast({
          title: `${result.errors.length} row error${result.errors.length > 1 ? 's' : ''}`,
          description: result.errors.slice(0, 3).join('\n'),
          variant: 'destructive',
        })
      }
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await productsApi.exportCsv()
      toast({ title: 'Export downloaded', description: 'products-export.csv saved to your downloads' })
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' })
    } finally {
      setIsExporting(false)
    }
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<ProductSummary | null>(null)

  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return
    deleteProduct(deletingProduct.id, {
      onSuccess: () => {
        toast({ title: `"${deletingProduct.name}" deleted` })
        setDeletingProduct(null)
      },
      onError: () => {
        toast({ title: 'Failed to delete product', variant: 'destructive' })
        setDeletingProduct(null)
      },
    })
  }

  const handleEditClick = async (product: ProductSummary) => {
    const detail = await productsApi.getById(product.id)
    setEditingProduct(detail)
  }

  const stockBadge = (qty: number) => {
    if (qty === 0)  return <span className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-600">Out of stock</span>
    if (qty <= 5)   return <span className="inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-bold text-orange-600">{qty} left</span>
    return               <span className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-bold text-green-700">{qty}</span>
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              <h1 className="text-3xl font-black text-zinc-950">Product Management</h1>
            </div>
            <p className="text-sm text-zinc-400 font-medium">
              {products?.length ?? 0} products in catalog
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-end">
            {/* Export */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-all disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              {isExporting ? 'Exporting…' : 'Export CSV'}
            </button>

            {/* Import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 transition-all disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isImporting ? 'Importing…' : 'Import CSV'}
            </button>

            {/* Add */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Import hint */}
        <div className="mb-6 rounded-2xl bg-zinc-50 border border-zinc-100 px-5 py-3 text-xs text-zinc-500 font-medium">
          <span className="font-bold text-zinc-700">Import behaviour:</span> matches on Name + Brand (case-insensitive). Existing products are updated; new rows are added. Nothing is deleted.
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead className="w-16 font-black text-zinc-700 text-xs uppercase tracking-wider">Image</TableHead>
                  <TableHead className="font-black text-zinc-700 text-xs uppercase tracking-wider">Name</TableHead>
                  <TableHead className="font-black text-zinc-700 text-xs uppercase tracking-wider">Brand</TableHead>
                  <TableHead className="font-black text-zinc-700 text-xs uppercase tracking-wider">Price</TableHead>
                  <TableHead className="font-black text-zinc-700 text-xs uppercase tracking-wider">Sizes</TableHead>
                  <TableHead className="font-black text-zinc-700 text-xs uppercase tracking-wider">Stock</TableHead>
                  <TableHead className="w-24 text-right font-black text-zinc-700 text-xs uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <TableRow key={product.id} className="hover:bg-zinc-50/60">
                      <TableCell>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-10 w-10 rounded-xl object-cover bg-zinc-100"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100">
                            <Package className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-900 max-w-[180px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                          {product.brand}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400 max-w-[120px] truncate">
                        {product.sizesCsv ?? '—'}
                      </TableCell>
                      <TableCell>
                        {stockBadge(product.stockQty)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-all"
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center">
                      <Package className="h-10 w-10 mx-auto mb-3 text-zinc-200" />
                      <p className="text-zinc-400 font-medium">No products yet.</p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-3 text-sm font-bold text-orange-500 hover:text-orange-400 underline underline-offset-4"
                      >
                        Add your first product
                      </button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ProductFormModal
        open={showAddModal || !!editingProduct}
        editingProduct={editingProduct}
        onClose={() => { setShowAddModal(false); setEditingProduct(null) }}
      />

      {deletingProduct && (
        <DeleteConfirmDialog
          open={!!deletingProduct}
          productName={deletingProduct.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingProduct(null)}
          isPending={isDeleting}
        />
      )}
    </div>
  )
}
