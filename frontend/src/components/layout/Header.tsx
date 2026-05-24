import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, LogOut, ShieldAlert, LogIn } from 'lucide-react'
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
    <header className="sticky top-0 z-50 glass-strong border-b border-white/10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold tracking-tight gradient-text">
          MyStreeT
        </Link>

        <nav className="flex items-center gap-1">
          {user?.isAdmin && (
            <Link
              to="/admin/products"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-white/10 hover:text-purple-200 transition-colors"
            >
              <ShieldAlert className="h-4 w-4" />
              Admin
            </Link>
          )}

          <Link
            to="/cart"
            className="relative rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-lg shadow-violet-500/50">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/30"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
