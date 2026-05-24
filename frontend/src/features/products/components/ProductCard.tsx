import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import type { ProductSummary } from '@/types'

interface Props {
  product: ProductSummary
}

export function ProductCard({ product }: Props) {
  const isOutOfStock = product.stockQty === 0

  return (
    <Link to={`/products/${product.id}`} className="group block">
      <div className="glass rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10 hover:-translate-y-1 h-full flex flex-col gradient-border">
        <div className="relative aspect-square bg-white/5 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">{product.brand}</p>
          <h3 className="font-semibold text-sm mt-1 line-clamp-2 text-foreground group-hover:text-white transition-colors">
            {product.name}
          </h3>
          <p className="mt-auto pt-3 font-bold text-lg gradient-text">
            ₹{product.price.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </Link>
  )
}
