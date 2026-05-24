import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'
import { PRODUCT_KEYS } from '@/features/products/hooks/useProducts'

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof productsApi.update>[1] }) =>
      productsApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.all }),
  })
}
