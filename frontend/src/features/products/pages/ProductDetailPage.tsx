import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, AlertCircle, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-12 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
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
          <p className="text-lg font-bold text-zinc-800">Product not found</p>
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
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => navigate(-1)}
        className="mb-10 flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="grid gap-12 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-300">
              No image available
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-2">
              {product.brand}
            </p>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-950 leading-tight">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-black text-zinc-950">
              ₹{product.price.toLocaleString('en-IN')}
            </p>
          </div>

          {product.description && (
            <p className="text-zinc-500 leading-relaxed text-sm border-t border-zinc-100 pt-5">
              {product.description}
            </p>
          )}

          {isOutOfStock ? (
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 px-5 py-4 text-sm font-semibold text-zinc-500">
              This style is currently out of stock.
            </div>
          ) : (
            <>
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-zinc-400">
                  Select Size (UK)
                </p>
                <SizeSelector
                  sizesCsv={product.sizesCsv ?? ''}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                />
              </div>

              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.15em] text-zinc-400">
                  Quantity
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-black tabular-nums text-zinc-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full gap-2 text-sm font-black uppercase tracking-widest rounded-full bg-zinc-950 hover:bg-orange-500 transition-colors h-14"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            </>
          )}

          <p className="text-xs text-zinc-400">
            {product.stockQty > 0
              ? `${product.stockQty} units in stock`
              : 'Currently out of stock'}
          </p>
        </div>
      </div>
    </div>
  )
}
