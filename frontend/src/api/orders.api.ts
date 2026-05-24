import { apiClient } from './client'
import type { OrderDetail, OrderSummary, PlaceOrderRequest } from '@/types'

export const ordersApi = {
  place: (data: PlaceOrderRequest) =>
    apiClient.post<OrderDetail>('/orders', data).then((r) => r.data),

  mine: () =>
    apiClient.get<OrderSummary[]>('/orders/mine').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),
}
