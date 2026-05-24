import { useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton'
import { ProductFilters } from '../components/ProductFilters'
import { useProducts } from '../hooks/useProducts'

export default function ProductListPage() {
  const [brand, setBrand] = useState('')
  const [size, setSize]   = useState('')

  const { data: products, isLoading, isError } = useProducts({ brand, size })

  const handleClear = () => {
    setBrand('')
    setSize('')
  }

  const activeCount = products?.length ?? 0

  return (
    <div>
      {/* Hero banner */}
      <section className="hero-banner">
        <div className="container mx-auto px-4 py-10 md:py-14 relative z-10 flex items-center justify-between gap-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500 mb-3">
              New Season · 2026
            </p>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight uppercase">
              Fresh <span className="text-orange-500 italic">Kicks</span>
            </h1>
            <p className="mt-4 text-zinc-400 text-sm max-w-sm leading-relaxed">
              Authentic sneakers from the world's top brands — in stock and ready to ship.
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-72 h-72 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />
      </section>

      {/* Catalog section */}
      <div className="container mx-auto px-4 py-10">
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

        {/* Results header */}
        {!isLoading && !isError && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-zinc-500 font-medium">
              {activeCount === 0
                ? 'No results'
                : `${activeCount} style${activeCount !== 1 ? 's' : ''}`}
            </p>
            {(brand || size) && (
              <button
                onClick={handleClear}
                className="text-xs font-semibold text-zinc-400 hover:text-orange-500 underline underline-offset-4 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">
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
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-7xl mb-6 select-none">👟</div>
            <p className="text-lg font-bold text-zinc-800">No sneakers found</p>
            <p className="text-sm text-zinc-400 mt-1">Try adjusting your filters</p>
            {(brand || size) && (
              <button
                onClick={handleClear}
                className="mt-4 rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
