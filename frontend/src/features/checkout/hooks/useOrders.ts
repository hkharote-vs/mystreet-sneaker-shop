import { useMutation, useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders.api'

export const ORDER_KEYS = {
  all: ['orders'] as const,
  mine: () => [...ORDER_KEYS.all, 'mine'] as const,
  detail: (id: string) => [...ORDER_KEYS.all, 'detail', id] as const,
}

export function usePlaceOrder() {
  return useMutation({ mutationFn: ordersApi.place })
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

export function useMyOrders() {
  return useQuery({
    queryKey: ORDER_KEYS.mine(),
    queryFn: ordersApi.mine,
  })
}
