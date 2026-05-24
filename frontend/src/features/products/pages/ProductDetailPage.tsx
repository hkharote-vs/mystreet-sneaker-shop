import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, AlertCircle, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SizeSelector } from '../components/SizeSelector'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '@/features/cart/cart.store'
import { toast } from '@/components/ui/use-toast'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)

  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading, isError } = useProduct(id!)

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' })
      return
    }
    if (!product) return

    addItem({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      imageUrl: product.imageUrl,
      size: selectedSize,
      quantity,
    })

    toast({
      title: 'Added to cart',
      description: `${product.name} · UK ${selectedSize} · Qty ${quantity}`,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold">Product not found</p>
          <Button variant="outline" asChild>
            <Link to="/">Back to catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.stockQty === 0

  return (
    <div className="container mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Image panel */}
        <div className="aspect-square overflow-hidden rounded-2xl glass gradient-border">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="flex flex-col gap-6">
          <div>
            <Badge variant="outline" className="mb-3 text-violet-400 border-violet-500/40">
              {product.brand}
            </Badge>
            <h1 className="text-3xl font-black tracking-tight">{product.name}</h1>
            <p className="mt-3 text-3xl font-bold gradient-text">
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
          )}

          {isOutOfStock ? (
            <Badge variant="secondary" className="w-fit text-sm py-1.5 px-4">
              Out of Stock
            </Badge>
          ) : (
            <>
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-300 uppercase tracking-wider">Select Size</p>
                <SizeSelector
                  sizesCsv={product.sizesCsv ?? ''}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                />
              </div>

              {/* Quantity selector */}
              <div>
                <p className="mb-3 text-sm font-semibold text-slate-300 uppercase tracking-wider">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-semibold tabular-nums">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 hover:border-violet-500/50 hover:bg-violet-500/10 hover:text-white transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button size="lg" className="w-full gap-2 text-base" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            {product.stockQty > 0
              ? `${product.stockQty} units in stock`
              : 'Currently out of stock'}
          </p>
        </div>
      </div>
    </div>
  )
}
