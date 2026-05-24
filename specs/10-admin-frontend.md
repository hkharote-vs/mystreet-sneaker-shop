# SPEC-10: Admin — Product Management Frontend

**Status:** `[ ] Not Started`  
**Depends on:** SPEC-05 (frontend setup), SPEC-06 (auth — admin JWT), SPEC-03 (product backend)  
**Blocks:** Nothing (last frontend feature)  

---

## Overview

Build the admin product management page at `/admin/products`. Admins can view all products in a table, add a new product via a modal form, edit an existing product, and delete a product. All mutations invalidate the TanStack Query product cache so the catalog reflects changes immediately. Non-admins are redirected by `ProtectedRoute` (already implemented in SPEC-05).

---

## Files to Implement

```
features/admin/
  ├── hooks/
  │   └── useAdminProducts.ts    # Mutations wrapping productsApi write endpoints
  └── pages/
      └── AdminProductsPage.tsx  # Main admin page
  
components/admin/
  ├── ProductFormModal.tsx        # Create/Edit form in a Dialog
  └── DeleteConfirmDialog.tsx     # Confirm before deleting
```

---

## Implementation

### 1. `src/features/admin/hooks/useAdminProducts.ts`

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { PRODUCT_KEYS } from '@/features/products/hooks/useProducts'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      // Invalidate all product lists so the new product appears everywhere
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof productsApi.update>[1] }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all })
    },
  })
}
```

### 2. Zod Schema (`src/features/admin/admin.schemas.ts`)

```typescript
import { z } from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sizesCsv: z.string().optional(),
  stockQty: z
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
})

export type ProductFormData = z.infer<typeof productFormSchema>
```

### 3. `src/components/admin/ProductFormModal.tsx`

```typescript
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { productFormSchema, type ProductFormData } from '@/features/admin/admin.schemas'
import { useCreateProduct, useUpdateProduct } from '@/features/admin/hooks/useAdminProducts'
import type { ProductDetail } from '@/types'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editingProduct?: ProductDetail | null
}

export function ProductFormModal({ open, onClose, editingProduct }: Props) {
  const isEditing = !!editingProduct

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: editingProduct
      ? {
          name: editingProduct.name,
          brand: editingProduct.brand,
          description: editingProduct.description ?? '',
          price: editingProduct.price,
          imageUrl: editingProduct.imageUrl ?? '',
          sizesCsv: editingProduct.sizesCsv ?? '',
          stockQty: editingProduct.stockQty,
        }
      : { stockQty: 0 },
  })

  // Reset form when the product being edited changes
  useEffect(() => {
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        brand: editingProduct.brand,
        description: editingProduct.description ?? '',
        price: editingProduct.price,
        imageUrl: editingProduct.imageUrl ?? '',
        sizesCsv: editingProduct.sizesCsv ?? '',
        stockQty: editingProduct.stockQty,
      })
    } else {
      reset({ stockQty: 0 })
    }
  }, [editingProduct, reset])

  const { mutate: create, isPending: isCreating, error: createError } = useCreateProduct()
  const { mutate: update, isPending: isUpdating, error: updateError } = useUpdateProduct()

  const isPending = isCreating || isUpdating
  const apiError = (createError || updateError) as AxiosError<ApiError> | null
  const apiErrorMessage = apiError?.response?.data?.message ?? null

  const onSubmit = (data: ProductFormData) => {
    const payload = {
      ...data,
      imageUrl: data.imageUrl || undefined,
      description: data.description || undefined,
      sizesCsv: data.sizesCsv || undefined,
    }

    if (isEditing && editingProduct) {
      update(
        { id: editingProduct.id, data: payload },
        { onSuccess: () => { reset(); onClose() } },
      )
    } else {
      create(payload, { onSuccess: () => { reset(); onClose() } })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiErrorMessage && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {apiErrorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register('name')} placeholder="Air Max 90" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="brand">Brand *</Label>
              <Input id="brand" {...register('brand')} placeholder="Nike" />
              {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register('description')} placeholder="Short product description" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                {...register('price', { valueAsNumber: true })}
                placeholder="119.99"
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="stockQty">Stock Quantity *</Label>
              <Input
                id="stockQty"
                type="number"
                min="0"
                {...register('stockQty', { valueAsNumber: true })}
                placeholder="50"
              />
              {errors.stockQty && <p className="text-xs text-destructive">{errors.stockQty.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="sizesCsv">Available Sizes (comma-separated)</Label>
            <Input
              id="sizesCsv"
              {...register('sizesCsv')}
              placeholder="7,8,9,10,11"
            />
            <p className="text-xs text-muted-foreground">UK sizes, e.g. 7,8,9,10</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              {...register('imageUrl')}
              placeholder="https://example.com/image.jpg"
            />
            {errors.imageUrl && <p className="text-xs text-destructive">{errors.imageUrl.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing ? 'Saving...' : 'Creating...'
                : isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### 4. `src/components/admin/DeleteConfirmDialog.tsx`

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  open: boolean
  productName: string
  onConfirm: () => void
  onCancel: () => void
  isPending: boolean
}

export function DeleteConfirmDialog({
  open,
  productName,
  onConfirm,
  onCancel,
  isPending,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{productName}"?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The product will be removed from the catalog.
            Existing orders referencing this product are unaffected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 5. `src/features/admin/pages/AdminProductsPage.tsx`

```typescript
import { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductFormModal } from '@/components/admin/ProductFormModal'
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useDeleteProduct } from '../hooks/useAdminProducts'
import { useToast } from '@/components/ui/use-toast'
import type { ProductDetail, ProductSummary } from '@/types'

export default function AdminProductsPage() {
  const { data: products, isLoading } = useProducts()
  const { toast } = useToast()

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
        toast({
          title: 'Failed to delete product',
          variant: 'destructive',
        })
        setDeletingProduct(null)
      },
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Product Management</h1>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Sizes</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="w-28 text-right">Actions</TableHead>
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
                          className="h-10 w-10 rounded object-cover bg-gray-50"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-100" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{product.brand}</Badge>
                    </TableCell>
                    <TableCell>₹{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {product.sizesCsv ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stockQty === 0 ? 'destructive' : 'secondary'}>
                        {product.stockQty}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={async () => {
                            // Fetch full detail (summary doesn't have description)
                            const { productsApi } = await import('@/api/products.api')
                            const detail = await productsApi.getById(product.id)
                            setEditingProduct(detail)
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeletingProduct(product)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No products yet. Click "Add Product" to create one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <ProductFormModal
        open={showAddModal || !!editingProduct}
        editingProduct={editingProduct}
        onClose={() => {
          setShowAddModal(false)
          setEditingProduct(null)
        }}
      />

      {/* Delete Confirm */}
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
```

### 6. Additional shadcn/ui Components to Install

```bash
cd frontend
pnpm dlx shadcn@latest add alert-dialog table
```

---

## Behavior Specification

### Admin Page Table

```
On mount:
  → Fetches GET /api/products (same query as customer catalog — reuses cache)
  → Shows table with: image thumbnail, name, brand, price, sizes, stock badge
  → Stock = 0 → red badge
  → Stock > 0 → gray badge

"Add Product" button:
  → Opens ProductFormModal in "create" mode
  → Empty form
```

### Create Product Flow

```
Admin clicks "Add Product":
  → Modal opens with blank form
  → Fills in name, brand, price, stock (required)
  → Optionally adds description, image URL, sizes
  → Clicks "Create Product"
    → If validation fails: inline field errors, no API call
    → If valid: POST /api/products with admin token
      → Loading: button shows "Creating..."
      → On success:
        → Modal closes
        → Product cache invalidated → table refreshes with new product
      → On error:
        → Error banner in modal, modal stays open
```

### Edit Product Flow

```
Admin clicks Pencil icon on a row:
  → Fetches GET /api/products/{id} to get full detail (including description)
  → Modal opens pre-filled with all product data
  → Admin edits fields (only changed fields sent — service does null check)
  → Clicks "Save Changes"
    → PUT /api/products/{id}
    → On success: modal closes, cache invalidated, table shows updated data
    → On error: error banner in modal
```

### Delete Product Flow

```
Admin clicks Trash icon on a row:
  → DeleteConfirmDialog opens with product name
  → "Cancel" → dialog closes, nothing happens
  → "Delete" button:
    → DELETE /api/products/{id}
    → Loading: button shows "Deleting..."
    → On success: dialog closes, toast "Product deleted", table refreshes
    → On error: dialog closes, error toast
```

---

## Manual Verification Steps

```
1. Login as admin@mystreet.com / Admin@1234
2. Navigate to /admin/products
   - Table shows all 10 seeded products
   - Each row has image, name, brand, price, sizes, stock, edit/delete buttons

3. Click "Add Product"
   - Modal opens with empty form
   - Submit empty form → inline errors on Name, Brand, Price, Stock
   - Fill in: name="Test Sneaker", brand="TestBrand", price=99.99, stock=25
   - Click "Create Product" → modal closes
   - New product appears in table (11th row)
   - Navigate to http://localhost:5173 → new product visible in catalog

4. Click Pencil on "Test Sneaker"
   - Modal opens pre-filled with "Test Sneaker" data
   - Change price to 89.99
   - Click "Save Changes" → modal closes
   - Row shows updated price 89.99

5. Click Trash on "Test Sneaker"
   - Confirm dialog appears: "Delete 'Test Sneaker'?"
   - Click Cancel → dialog closes, product still in table
   - Click Trash again → Confirm → Delete
   - Product removed from table + toast shown

6. Login as regular user (user@mystreet.com)
   - Navigate to /admin/products
   - Redirected to / (ProtectedRoute adminOnly)
   
7. Verify: Products created/edited in admin immediately visible in catalog at /
```

---

## Acceptance Criteria

- [ ] Admin page shows all products in a table with image, name, brand, price, sizes, stock
- [ ] Non-admin users navigating to `/admin/products` are redirected to `/`
- [ ] "Add Product" modal opens with empty form
- [ ] Create form shows inline errors for missing required fields
- [ ] Creating a valid product closes modal and adds row to table
- [ ] New product immediately visible in customer catalog (`/`)
- [ ] Edit modal pre-fills with existing product data
- [ ] Editing and saving updates the row in the table
- [ ] Delete triggers a confirmation dialog before deleting
- [ ] Cancelling delete does nothing
- [ ] Confirmed delete removes row from table and shows success toast
- [ ] Stock = 0 shows a red badge in the table
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
