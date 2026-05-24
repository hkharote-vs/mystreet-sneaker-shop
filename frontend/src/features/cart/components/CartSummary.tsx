import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck } from 'lucide-react'
import { useCartStore } from '../cart.store'

interface Props {
  onCheckout?: () => void
}

export function CartSummary({ onCheckout }: Props) {
  const totalPrice = useCartStore((s) => s.totalPrice())
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 font-medium">
            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
          <span className="font-bold text-zinc-900">₹{totalPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 font-medium">Delivery</span>
          <span className="font-bold text-green-600">Free</span>
        </div>
      </div>

      <div className="border-t-2 border-zinc-100 pt-4 flex justify-between items-center">
        <span className="text-base font-black text-zinc-950">Total</span>
        <span className="text-2xl font-black text-zinc-950">
          ₹{totalPrice.toLocaleString('en-IN')}
        </span>
      </div>

      <Link
        to="/checkout"
        onClick={onCheckout}
        className="w-full h-14 rounded-2xl bg-zinc-950 text-white text-sm font-black uppercase tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-950/10"
      >
        Proceed to Checkout
        <ArrowRight className="h-4 w-4" />
      </Link>

      <div className="space-y-2.5 pt-1">
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <Truck className="h-3.5 w-3.5 shrink-0" />
          Free delivery on all orders
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Secure mock checkout
        </div>
      </div>
    </div>
  )
}
