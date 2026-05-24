import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft, Trash2, ArrowRight, Truck, ShieldCheck } from 'lucide-react'
import { CartItem } from '../components/CartItem'
import { useCartStore } from '../cart.store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const totalItems = useCartStore((s) => s.totalItems())

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="inline-flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 p-12 mb-8">
          <ShoppingBag className="h-20 w-20 text-zinc-200" />
        </div>
        <h1 className="text-4xl font-black text-zinc-950 mb-3">Your cart is empty</h1>
        <p className="text-zinc-400 text-base mb-10 max-w-xs leading-relaxed">
          You haven't added any sneakers yet. Browse our collection and find your next pair.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-10 py-4 text-sm font-black uppercase tracking-widest text-white hover:bg-orange-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Browse Sneakers
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col lg:flex-row">

      {/* ── LEFT PANEL: Items (white, scrollable) ── */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="flex items-baseline justify-between mb-8">
            <div>
              <h1 className="text-3xl font-black text-zinc-950 tracking-tight">Your Cart</h1>
              <p className="text-zinc-400 text-sm mt-1">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            </div>
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </button>
          </div>

          {/* Item list — no card, pure rows */}
          <div>
            {items.map((item) => (
              <CartItem key={`${item.productId}-${item.size}`} item={item} />
            ))}
          </div>

          <div className="pt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Order summary (dark, sticky full height) ── */}
      <div className="lg:w-[420px] xl:w-[480px] bg-zinc-950 lg:sticky lg:top-16 lg:h-[calc(100vh-64px)] flex flex-col">
        <div className="flex-1 flex flex-col justify-between px-8 py-10 overflow-y-auto">

          <div>
            <h2 className="text-xl font-black text-white mb-8 uppercase tracking-widest">
              Order Summary
            </h2>

            {/* Item list in summary */}
            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div key={`${item.productId}-${item.size}`} className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-600 text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">UK {item.size} · Qty {item.quantity}</p>
                  </div>
                  <p className="text-white text-sm font-bold shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-800 mb-6" />

            {/* Pricing breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-white font-semibold">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Delivery</span>
                <span className="text-green-400 font-bold">Free</span>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-5 mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-zinc-300 font-semibold">Total</span>
                <span className="text-3xl font-black text-white">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">Incl. all taxes</p>
            </div>
          </div>

          {/* Bottom: CTA + trust badges */}
          <div className="space-y-4">
            <Link
              to="/checkout"
              className="w-full h-14 rounded-2xl bg-orange-500 text-white text-sm font-black uppercase tracking-widest hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-orange-500/20"
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                <Truck className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                Free delivery on all orders
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-600 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                Secure mock checkout — no real payment
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
