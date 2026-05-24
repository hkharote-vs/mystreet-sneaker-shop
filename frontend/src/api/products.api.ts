import { apiClient } from './client'
import type { ProductSummary, ProductDetail, CreateProductRequest } from '@/types'

export const productsApi = {
  list: (params?: { brand?: string; size?: string }) =>
    apiClient.get<ProductSummary[]>('/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ProductDetail>(`/products/${id}`).then((r) => r.data),

  create: (data: CreateProductRequest) =>
    apiClient.post<ProductDetail>('/products', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateProductRequest>) =>
    apiClient.put<ProductDetail>(`/products/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/products/${id}`).then((r) => r.data),

  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient
      .post<{ imported: number; skipped: number; errors: string[] }>('/products/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
