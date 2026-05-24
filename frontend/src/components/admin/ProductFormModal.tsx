import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { productFormSchema, type ProductFormData } from '@/features/admin/admin.schemas'
import { useCreateProduct, useUpdateProduct } from '@/features/admin/hooks/useAdminProducts'
import type { ProductDetail, ApiError } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  editingProduct?: ProductDetail | null
}

export function ProductFormModal({ open, onClose, editingProduct }: Props) {
  const isEditing = !!editingProduct

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProductFormData>({
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
  const apiErrorMessage =
    ((createError || updateError) as AxiosError<ApiError> | null)?.response?.data?.message ?? null

  const onSubmit = (data: ProductFormData) => {
    const payload = {
      ...data,
      imageUrl: data.imageUrl || undefined,
      description: data.description || undefined,
      sizesCsv: data.sizesCsv || undefined,
    }

    if (isEditing && editingProduct) {
      update({ id: editingProduct.id, data: payload }, { onSuccess: () => { reset(); onClose() } })
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {apiErrorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {apiErrorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-slate-300">Name *</Label>
              <Input id="name" placeholder="Air Max 90" {...register('name')} />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-slate-300">Brand *</Label>
              <Input id="brand" placeholder="Nike" {...register('brand')} />
              {errors.brand && <p className="text-xs text-red-400">{errors.brand.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-slate-300">Description</Label>
            <Input id="description" placeholder="Short product description" {...register('description')} />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-slate-300">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="9999"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stockQty" className="text-slate-300">Stock *</Label>
              <Input
                id="stockQty"
                type="number"
                min="0"
                placeholder="50"
                {...register('stockQty', { valueAsNumber: true })}
              />
              {errors.stockQty && <p className="text-xs text-red-400">{errors.stockQty.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sizesCsv" className="text-slate-300">Sizes (comma-separated UK sizes)</Label>
            <Input id="sizesCsv" placeholder="7,8,9,10,11" {...register('sizesCsv')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="imageUrl" className="text-slate-300">Image URL</Label>
            <Input id="imageUrl" type="url" placeholder="https://..." {...register('imageUrl')} />
            {errors.imageUrl && <p className="text-xs text-red-400">{errors.imageUrl.message}</p>}
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}
              className="border-white/15 hover:bg-white/10">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (isEditing ? 'Saving...' : 'Creating...')
                : (isEditing ? 'Save Changes' : 'Create Product')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
