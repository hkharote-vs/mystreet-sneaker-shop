import { apiClient } from './client'
import type { AuthResponse } from '@/types'

export const authApi = {
  register: (data: { email: string; password: string; fullName?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
}
