# SPEC-05: Frontend Setup & Shell

**Status:** `[x] Complete`  
**Depends on:** SPEC-00 (project setup)  
**Blocks:** SPEC-06, SPEC-07, SPEC-08, SPEC-09, SPEC-10  

---

## Overview

Configure all frontend infrastructure: routing, Axios client with auth interceptors, Zustand store setup, shadcn/ui components, global layout (Header + Footer), and page stubs for every route. After this spec, every route exists as a stub, the shell renders, and the dev server connects to the backend.

---

## Directory Structure (after this spec)

```
frontend/src/
  ├── api/
  │   ├── client.ts              # Axios instance
  │   ├── auth.api.ts            # Auth API functions
  │   ├── products.api.ts        # Product API functions
  │   └── orders.api.ts          # Order API functions
  ├── components/
  │   ├── ui/                    # shadcn/ui components (auto-generated)
  │   ├── layout/
  │   │   ├── Header.tsx
  │   │   ├── Footer.tsx
  │   │   ├── RootLayout.tsx
  │   │   └── AdminLayout.tsx
  │   └── shared/
  │       └── ProtectedRoute.tsx
  ├── features/
  │   ├── auth/
  │   │   ├── auth.store.ts      # Zustand auth store
  │   │   └── pages/
  │   │       ├── LoginPage.tsx  # stub
  │   │       └── RegisterPage.tsx # stub
  │   ├── products/
  │   │   └── pages/
  │   │       ├── ProductListPage.tsx  # stub
  │   │       └── ProductDetailPage.tsx # stub
  │   ├── cart/
  │   │   └── cart.store.ts      # Zustand cart store
  │   ├── checkout/
  │   │   └── pages/
  │   │       ├── CheckoutPage.tsx   # stub
  │   │       └── OrderConfirmPage.tsx # stub
  │   └── admin/
  │       └── pages/
  │           └── AdminProductsPage.tsx # stub
  ├── types/
  │   └── index.ts               # All shared TypeScript types
  ├── lib/
  │   └── utils.ts               # cn() helper (shadcn standard)
  ├── router.tsx                 # All routes defined
  ├── main.tsx
  └── index.css
```

---

## Implementation

### 1. TypeScript Types (`src/types/index.ts`)

```typescript
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
```

### 2. Axios Client (`src/api/client.ts`)

```typescript
import axios, { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach JWT to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear auth state
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
```

### 3. API Functions

```typescript
// src/api/auth.api.ts
import { apiClient } from './client'
import type { AuthResponse } from '@/types'

export const authApi = {
  register: (data: { email: string; password: string; fullName?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),
}

// src/api/products.api.ts
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
}

// src/api/orders.api.ts
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
```

### 4. Auth Store (`src/features/auth/auth.store.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        localStorage.setItem('token', token)
        set({ token, user, isAuthenticated: true })
      },
      clearAuth: () => {
        localStorage.removeItem('token')
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'mystreet-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true
        }
      },
    },
  ),
)
```

### 5. Cart Store (`src/features/cart/cart.store.ts`)

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.size === newItem.size,
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.size === newItem.size
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i,
              ),
            }
          }
          return { items: [...state.items, newItem] }
        }),

      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size),
          ),
        })),

      updateQuantity: (productId, size, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.size === size),
                )
              : state.items.map((i) =>
                  i.productId === productId && i.size === size
                    ? { ...i, quantity }
                    : i,
                ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'mystreet-cart' },
  ),
)
```

### 6. Layout Components

```typescript
// src/components/layout/RootLayout.tsx
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// src/components/layout/Header.tsx
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth/auth.store'
import { useCartStore } from '@/features/cart/cart.store'

export function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, clearAuth } = useAuthStore()
  const totalItems = useCartStore((s) => s.totalItems())

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold tracking-tight">
          MyStreeT
        </Link>

        <nav className="flex items-center gap-4">
          {user?.isAdmin && (
            <Link to="/admin/products" className="text-sm font-medium hover:underline">
              Admin
            </Link>
          )}

          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                  {totalItems}
                </Badge>
              )}
            </Link>
          </Button>

          {isAuthenticated ? (
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}

// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      © 2026 MyStreeT. Built with React + Spring Boot.
    </footer>
  )
}
```

### 7. Protected Route (`src/components/shared/ProtectedRoute.tsx`)

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/auth.store'

interface Props {
  adminOnly?: boolean
}

export function ProtectedRoute({ adminOnly = false }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
```

### 8. Router (`src/router.tsx`)

```typescript
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

// Lazy load heavy pages for code splitting
const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage'))
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage'))
const OrderConfirmPage = lazy(() => import('@/features/checkout/pages/OrderConfirmPage'))
const AdminProductsPage = lazy(() => import('@/features/admin/pages/AdminProductsPage'))

const Loading = () => (
  <div className="flex min-h-[200px] items-center justify-center">
    <span className="text-muted-foreground">Loading...</span>
  </div>
)

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <Suspense fallback={<Loading />}><ProductListPage /></Suspense> },
      { path: 'products/:id', element: <Suspense fallback={<Loading />}><ProductDetailPage /></Suspense> },
      { path: 'login', element: <Suspense fallback={<Loading />}><LoginPage /></Suspense> },
      { path: 'register', element: <Suspense fallback={<Loading />}><RegisterPage /></Suspense> },
      { path: 'cart', element: <Suspense fallback={<Loading />}><CartPage /></Suspense> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'checkout', element: <Suspense fallback={<Loading />}><CheckoutPage /></Suspense> },
          { path: 'orders/confirm/:id', element: <Suspense fallback={<Loading />}><OrderConfirmPage /></Suspense> },
        ],
      },
      {
        element: <ProtectedRoute adminOnly />,
        children: [
          { path: 'admin/products', element: <Suspense fallback={<Loading />}><AdminProductsPage /></Suspense> },
        ],
      },
    ],
  },
])
```

### 9. Page Stubs

Create a stub for each page so routes resolve during development:

```typescript
// Each stub follows this pattern:
// src/features/products/pages/ProductListPage.tsx
export default function ProductListPage() {
  return <div className="container mx-auto p-8"><h1>Product List — Coming Soon</h1></div>
}
```

Create stubs for:
- `features/products/pages/ProductListPage.tsx`
- `features/products/pages/ProductDetailPage.tsx`
- `features/auth/pages/LoginPage.tsx`
- `features/auth/pages/RegisterPage.tsx`
- `features/cart/pages/CartPage.tsx`
- `features/checkout/pages/CheckoutPage.tsx`
- `features/checkout/pages/OrderConfirmPage.tsx`
- `features/admin/pages/AdminProductsPage.tsx`

### 10. `src/lib/utils.ts` (shadcn standard)

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 11. Install shadcn/ui Components Needed Across All Specs

```bash
cd frontend
pnpm dlx shadcn@latest add button input label badge card
pnpm dlx shadcn@latest add dialog sheet table select toast
pnpm dlx shadcn@latest add form separator skeleton
```

---

## `package.json` Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

---

## Tailwind Global Styles (`src/index.css`)

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* Add full shadcn CSS variable set */
  }
}

* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
}
```

---

## Verification Steps

```bash
cd frontend

# Install all deps
pnpm install

# Type check — zero errors expected
pnpm run type-check

# Lint — zero warnings/errors
pnpm run lint

# Dev server
pnpm run dev
# Open http://localhost:5173 — should see product list stub
# Navigate to /login, /cart, /admin/products — all render stubs
# Navigate to /checkout — should redirect to /login (ProtectedRoute)

# Build — should succeed with code-split chunks
pnpm run build
# Check dist/ folder exists with index.html and assets/
```

---

## Acceptance Criteria

- [ ] `pnpm run dev` starts with no errors
- [ ] All 8 routes navigate to stub pages without crashing
- [ ] `/checkout` redirects to `/login` when not authenticated
- [ ] `/admin/products` redirects to `/` for non-admin users
- [ ] Header shows cart badge count (starts at 0)
- [ ] Header shows Login button when not authenticated
- [ ] `pnpm run type-check` passes with zero errors
- [ ] `pnpm run lint` passes with zero warnings
- [ ] `pnpm run build` succeeds and creates `dist/` with split chunks
- [ ] Cart store persists in localStorage (add test item via devtools, refresh, check)
- [ ] Auth store persists in localStorage (simulated by manually setting values)
