import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { RootLayout } from '@/components/layout/RootLayout'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

const ProductListPage = lazy(() => import('@/features/products/pages/ProductListPage'))
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/features/checkout/pages/CheckoutPage'))
const OrderConfirmPage = lazy(() => import('@/features/checkout/pages/OrderConfirmPage'))
const AdminProductsPage = lazy(() => import('@/features/admin/pages/AdminProductsPage'))

function Loading() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
      Loading...
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Suspense fallback={<Loading />}><ProductListPage /></Suspense>,
      },
      {
        path: 'products/:id',
        element: <Suspense fallback={<Loading />}><ProductDetailPage /></Suspense>,
      },
      {
        path: 'login',
        element: <Suspense fallback={<Loading />}><LoginPage /></Suspense>,
      },
      {
        path: 'register',
        element: <Suspense fallback={<Loading />}><RegisterPage /></Suspense>,
      },
      {
        path: 'cart',
        element: <Suspense fallback={<Loading />}><CartPage /></Suspense>,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'checkout',
            element: <Suspense fallback={<Loading />}><CheckoutPage /></Suspense>,
          },
          {
            path: 'orders/confirm/:id',
            element: <Suspense fallback={<Loading />}><OrderConfirmPage /></Suspense>,
          },
        ],
      },
      {
        element: <ProtectedRoute adminOnly />,
        children: [
          {
            path: 'admin/products',
            element: <Suspense fallback={<Loading />}><AdminProductsPage /></Suspense>,
          },
        ],
      },
    ],
  },
])
