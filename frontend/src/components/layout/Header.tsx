import { Link, useNavigate } from 'react-router-dom'
import { LogOut, ShieldAlert, LogIn } from 'lucide-react'
import { useAuthStore } from '@/features/auth/auth.store'
import { CartDrawer } from '@/features/cart/components/CartDrawer'

export function Header() {
  const navigate = useNavigate()
  const { user, isAuthenticated, clearAuth } = useAuthStore()

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-zinc-200">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-0.5">
          <span className="text-xl font-black tracking-tight text-zinc-950 uppercase">My</span>
          <span className="text-xl font-black tracking-tight text-orange-500 uppercase">StreeT</span>
        </Link>

        <nav className="flex items-center gap-1">
          {user?.isAdmin && (
            <Link
              to="/admin/products"
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}

          <CartDrawer />

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-900 transition-all"
              aria-label="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-1 flex items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-1.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-orange-500 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
