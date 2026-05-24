import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '../cart.store'
import type { CartItem as CartItemType } from '@/types'

interface Props {
  item: CartItemType
}

export function CartItem({ item }: Props) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-4 py-4">
      {/* Thumbnail */}
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/10">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">{item.brand}</p>
        <p className="font-semibold text-sm leading-tight truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">UK {item.size}</p>

        <div className="mt-auto flex items-center justify-between pt-2">
          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white transition-all"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-5 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-400 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white transition-all"
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* Price + delete */}
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm gradient-text">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
            <button
              onClick={() => removeItem(item.productId, item.size)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all"
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
