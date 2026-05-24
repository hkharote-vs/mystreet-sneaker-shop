import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, AlertCircle, Minus, Plus, CheckCircle2, AlertTriangle, Package } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SizeSelector } from '../components/SizeSelector'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '@/features/cart/cart.store'
import { toast } from '@/components/ui/use-toast'

function StockBadge({ qty }: { qty: number }) {
  if (qty === 0) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-4 py-2 w-fit">
        <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
        <span className="text-sm font-bold text-red-600">Sold Out</span>
      </div>
    )
  }
  if (qty <= 5) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-orange-50 border border-orange-200 px-4 py-2 w-fit">
        <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
        <span className="text-sm font-bold text-orange-600">Only {qty} left — almost gone!</span>
      </div>
    )
  }
  if (qty <= 15) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-2 w-fit">
        <Package className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span className="text-sm font-bold text-amber-700">{qty} units left</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2 w-fit">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
      <span className="text-sm font-bold text-green-700">In Stock · {qty} available</span>
    </div>
  )
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)

  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)

  const { data: product, isLoading, isError } = useProduct(id!)

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: 'Select a size first', variant: 'destructive' })
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
      title: '✓ Added to cart',
      description: `${product.name} · UK ${selectedSize} · Qty ${quantity}`,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-5 w-16 mb-10" />
        <div className="grid gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="space-y-6 pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-px w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-px w-full" />
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-16 rounded-xl" />)}
            </div>
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <AlertCircle className="h-12 w-12 text-zinc-300" />
          <p className="text-xl font-black text-zinc-800">Product not found</p>
          <Link
            to="/"
            className="rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
          >
            Back to catalog
          </Link>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.stockQty === 0

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-10">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* ── LEFT: Image ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="aspect-square overflow-hidden rounded-3xl bg-zinc-50 border border-zinc-100">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300 text-sm">
                  No image
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Info ── */}
          <div className="flex flex-col gap-0">
            {/* Brand + Name + Price */}
            <div className="pb-7 border-b border-zinc-100">
              <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-orange-500 mb-3">
                {product.brand}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-zinc-950 leading-tight tracking-tight">
                {product.name}
              </h1>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-4xl font-black text-zinc-950">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-zinc-400 font-medium">incl. all taxes</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="py-7 border-b border-zinc-100">
                <p className="text-zinc-600 leading-relaxed text-[15px]">{product.description}</p>
              </div>
            )}

            {isOutOfStock ? (
              <div className="py-7">
                <div className="rounded-2xl bg-zinc-50 border border-zinc-200 px-6 py-8 text-center">
                  <p className="text-lg font-black text-zinc-800 mb-1">Out of Stock</p>
                  <p className="text-sm text-zinc-400">This style is currently unavailable.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Size selector */}
                <div className="py-7 border-b border-zinc-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-800">
                      Select Size (UK)
                    </p>
                    {selectedSize && (
                      <span className="text-xs font-bold text-orange-500">
                        Selected: UK {selectedSize}
                      </span>
                    )}
                  </div>
                  <SizeSelector
                    sizesCsv={product.sizesCsv ?? ''}
                    selectedSize={selectedSize}
                    onSelect={setSelectedSize}
                  />
                  {!selectedSize && (
                    <p className="mt-3 text-xs text-zinc-400">← Pick a size to continue</p>
                  )}
                </div>

                {/* Stock badge + Quantity + CTA */}
                <div className="pt-7 flex flex-col gap-6">
                  {/* Stock indicator */}
                  <StockBadge qty={product.stockQty} />

                  {/* Quantity */}
                  <div>
                    <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-zinc-800">
                      Quantity
                    </p>
                    <div className="inline-flex items-center gap-0 rounded-2xl border-2 border-zinc-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-12 w-12 items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-40"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center text-base font-black tabular-nums text-zinc-950 border-x-2 border-zinc-200 h-12 flex items-center justify-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                        className="flex h-12 w-12 items-center justify-center text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors disabled:opacity-40"
                        disabled={quantity >= product.stockQty}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    className={`
                      w-full h-16 rounded-2xl flex items-center justify-center gap-3
                      text-base font-black uppercase tracking-widest
                      transition-all duration-200
                      ${selectedSize
                        ? 'bg-zinc-950 text-white hover:bg-orange-500 shadow-lg shadow-zinc-950/20 hover:shadow-orange-500/30 active:scale-[0.98]'
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {selectedSize ? 'Add to Cart' : 'Select a Size'}
                  </button>

                  {/* Subtotal hint */}
                  {selectedSize && quantity > 1 && (
                    <p className="text-center text-sm font-semibold text-zinc-500">
                      Subtotal:&nbsp;
                      <span className="text-zinc-900 font-black">
                        ₹{(product.price * quantity).toLocaleString('en-IN')}
                      </span>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
