import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  list: (filters: { brand?: string; size?: string }) =>
    [...PRODUCT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...PRODUCT_KEYS.all, 'detail', id] as const,
}

export function useProducts(filters: { brand?: string; size?: string } = {}) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => productsApi.list(filters),
    staleTime: 1000 * 60 * 5,
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  })
}
