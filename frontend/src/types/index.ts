export interface User {
  id: string
  email: string
  fullName: string | null
  isAdmin: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ProductSummary {
  id: string
  name: string
  brand: string
  price: number
  imageUrl: string | null
  sizesCsv: string | null
  stockQty: number
}

export interface ProductDetail extends ProductSummary {
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  productId: string | null
  productName: string
  productPrice: number
  size: string
  quantity: number
  subtotal: number
}

export interface ShippingAddress {
  name: string
  addressLine: string
  city: string
  pin: string
  phone: string
}

export interface OrderDetail {
  id: string
  status: string
  paymentMode: string
  totalAmount: number
  shippingAddress: ShippingAddress
  items: OrderItem[]
  createdAt: string
}

export interface OrderSummary {
  id: string
  status: string
  paymentMode: string
  totalAmount: number
  itemCount: number
  createdAt: string
}

export interface CartItem {
  productId: string
  name: string
  brand: string
  price: number
  imageUrl: string | null
  size: string
  quantity: number
}

export interface ApiError {
  timestamp: string
  path: string
  error: string
  message: string
  details: string[]
}

export interface PlaceOrderRequest {
  items: { productId: string; size: string; quantity: number }[]
  shippingAddress: ShippingAddress
  paymentMode: 'MOCK_COD' | 'MOCK_UPI'
}

export interface CreateProductRequest {
  name: string
  brand: string
  description?: string
  price: number
  imageUrl?: string
  sizesCsv?: string
  stockQty: number
}
