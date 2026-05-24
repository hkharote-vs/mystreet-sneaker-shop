import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton'
import { ProductFilters } from '../components/ProductFilters'
import { useProducts } from '../hooks/useProducts'

export default function ProductListPage() {
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')

  const { data: products, isLoading, isError } = useProducts({ brand, size })

  const handleClear = () => {
    setBrand('')
    setSize('')
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Hero heading */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight gradient-text">Sneakers</h1>
        <p className="text-muted-foreground mt-1">Find your next pair</p>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ProductFilters
          brand={brand}
          size={size}
          onBrandChange={setBrand}
          onSizeChange={setSize}
          onClear={handleClear}
        />
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load products. Please try again.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">👟</div>
          <p className="text-lg font-semibold text-muted-foreground">No sneakers found</p>
          {(brand || size) && (
            <button
              onClick={handleClear}
              className="mt-3 text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
