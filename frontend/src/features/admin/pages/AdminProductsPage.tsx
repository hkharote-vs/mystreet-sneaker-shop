import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert, Package, Upload } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { PRODUCT_KEYS } from '@/features/products/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    try {
      const result = await productsApi.importCsv(file)
      toast({
        title: `Imported ${result.imported} products`,
        description: result.skipped > 0 ? `${result.skipped} rows skipped` : undefined,
      })
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
    const { productsApi } = await import('@/api/products.api')
    const detail = await productsApi.getById(product.id)
    setEditingProduct(detail)
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-5 w-5 text-violet-400" />
            <h1 className="text-3xl font-black gradient-text">Product Management</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {products?.length ?? 0} products in catalog
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="gap-2 border-white/15 hover:bg-white/10"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="glass rounded-2xl p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl gradient-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sizes</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products && products.length > 0 ? (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover bg-white/5"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold max-w-[180px] truncate">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-violet-400 border-violet-500/40">
                        {product.brand}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{product.price.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {product.sizesCsv ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.stockQty === 0 ? 'destructive' : 'secondary'}
                        className={product.stockQty === 0
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'}
                      >
                        {product.stockQty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditClick(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/10 hover:text-violet-400 transition-all"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingProduct(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all"
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
                  <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p>No products yet.</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-2 text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2"
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
