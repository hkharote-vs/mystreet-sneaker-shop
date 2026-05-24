import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, ShieldAlert } from 'lucide-react'
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

        <nav className="flex items-center gap-2">
          {user?.isAdmin && (
            <Link
              to="/admin/products"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground px-2"
            >
              <ShieldAlert className="h-4 w-4" />
              Admin
            </Link>
          )}

          <Link to="/cart" className="relative p-2 hover:bg-accent rounded-md">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
