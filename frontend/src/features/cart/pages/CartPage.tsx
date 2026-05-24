import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartItem } from '../components/CartItem'
import { CartSummary } from '../components/CartSummary'
import { useCartStore } from '../cart.store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-black gradient-text">Your Cart</h1>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-24 text-center">
          <div className="rounded-full glass p-8">
            <ShoppingBag className="h-14 w-14 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold">Your cart is empty</p>
            <p className="mt-2 text-muted-foreground">Looks like you haven&apos;t added anything yet.</p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Browse Sneakers
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2">
            <div className="glass rounded-2xl p-4 gradient-border">
              <div className="divide-y divide-white/10">
                {items.map((item) => (
                  <CartItem key={`${item.productId}-${item.size}`} item={item} />
                ))}
              </div>
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 gradient-border sticky top-24">
              <h2 className="font-bold text-lg mb-4">Order Summary</h2>
              <CartSummary />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
