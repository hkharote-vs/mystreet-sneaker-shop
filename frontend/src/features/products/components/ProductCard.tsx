import { Link } from 'react-router-dom'
import type { ProductSummary } from '@/types'

interface Props {
  product: ProductSummary
}

export function ProductCard({ product }: Props) {
  const isOutOfStock = product.stockQty === 0

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden card-lift">
        {/* Image */}
        <div className="relative aspect-square bg-zinc-50 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-300 text-sm">
              No image
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-zinc-900 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                Sold Out
              </span>
            </div>
          )}

          {/* Hover overlay */}
          {!isOutOfStock && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
              <span className="bg-zinc-950 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                View Details →
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-500 mb-1">
            {product.brand}
          </p>
          <h3 className="text-sm font-semibold text-zinc-900 line-clamp-1 group-hover:text-orange-500 transition-colors">
            {product.name}
          </h3>
          <p className="mt-2 text-base font-black text-zinc-950">
            ₹{product.price.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </Link>
  )
}
