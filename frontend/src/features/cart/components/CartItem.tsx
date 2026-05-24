import { Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../cart.store'
import type { CartItem as CartItemType } from '@/types'

interface Props {
  item: CartItemType
}

export function CartItem({ item }: Props) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-5 py-6 border-b border-zinc-100 last:border-0">
      {/* Thumbnail */}
      <Link to={`/products/${item.productId}`} className="shrink-0">
        <div className="h-28 w-28 overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-zinc-300">
              No img
            </div>
          )}
        </div>
      </Link>

      {/* Info + controls */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {/* Top row: name + remove */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-500">
              {item.brand}
            </p>
            <Link
              to={`/products/${item.productId}`}
              className="font-bold text-base text-zinc-900 leading-snug hover:text-orange-500 transition-colors block truncate"
            >
              {item.name}
            </Link>
            <p className="text-sm text-zinc-400 font-medium mt-0.5">
              Size: <span className="text-zinc-600 font-semibold">UK {item.size}</span>
            </p>
          </div>
          <button
            onClick={() => removeItem(item.productId, item.size)}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:bg-red-50 hover:text-red-500 transition-all mt-0.5"
            aria-label={`Remove ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Bottom row: qty stepper + price */}
        <div className="mt-auto flex items-center justify-between pt-3">
          {/* Quantity */}
          <div className="inline-flex items-center rounded-xl border border-zinc-200 overflow-hidden">
            <button
              onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
              className="flex h-9 w-9 items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-30"
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-black text-zinc-900 border-x border-zinc-200">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
              className="flex h-9 w-9 items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Price */}
          <div className="text-right">
            <p className="text-lg font-black text-zinc-950">
              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
            </p>
            {item.quantity > 1 && (
              <p className="text-xs text-zinc-400 font-medium">
                ₹{item.price.toLocaleString('en-IN')} each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
