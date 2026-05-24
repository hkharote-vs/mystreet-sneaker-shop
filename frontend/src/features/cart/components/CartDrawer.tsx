import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../cart.store'

export function CartDrawer() {
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <Link
      to="/cart"
      className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
      aria-label="View cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black text-white">
          {totalItems > 99 ? '99+' : totalItems}
        </span>
      )}
    </Link>
  )
}
