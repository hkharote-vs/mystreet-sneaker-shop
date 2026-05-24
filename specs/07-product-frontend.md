# SPEC-07: Product Catalog — Frontend

**Status:** `[x] Complete`  
**Depends on:** SPEC-05 (frontend setup), SPEC-03 (product backend running)  
**Blocks:** SPEC-08 (cart — needs product detail page to add to cart)  

---

## Overview

Build the `ProductListPage` (home page) and `ProductDetailPage`. The list page shows a responsive grid of product cards with brand and size filtering. The detail page shows full product info with a size selector and "Add to Cart" action. Uses TanStack Query for data fetching with loading skeletons and error states.

---

## Files to Implement

```
features/products/
  ├── hooks/
  │   └── useProducts.ts         # TanStack Query hooks
  ├── components/
  │   ├── ProductCard.tsx        # Card for list grid
  │   ├── ProductGrid.tsx        # Responsive grid wrapper
  │   ├── ProductFilters.tsx     # Brand + size filter bar
  │   ├── ProductCardSkeleton.tsx
  │   └── SizeSelector.tsx       # Size buttons on detail page
  └── pages/
      ├── ProductListPage.tsx
      └── ProductDetailPage.tsx
```

---

## Implementation

### 1. `src/features/products/hooks/useProducts.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/api/products.api'

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  list: (filters: { brand?: string; size?: string }) =>
    [...PRODUCT_KEYS.all, 'list', filters] as const,
  detail: (id: string) => [...PRODUCT_KEYS.all, 'detail', id] as const,
}

export function useProducts(filters: { brand?: string; size?: string } = {}) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => productsApi.list(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
  })
}
```

### 2. `src/features/products/components/ProductCard.tsx`

```typescript
import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ProductSummary } from '@/types'

interface Props {
  product: ProductSummary
}

export function ProductCard({ product }: Props) {
  const isOutOfStock = product.stockQty === 0

  return (
    <Link to={`/products/${product.id}`} className="group">
      <Card className="overflow-hidden transition-shadow hover:shadow-md h-full">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="secondary">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">{product.brand}</p>
          <h3 className="font-semibold truncate mt-0.5">{product.name}</h3>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0">
          <p className="font-bold text-lg">₹{product.price.toFixed(2)}</p>
        </CardFooter>
      </Card>
    </Link>
  )
}
```

### 3. `src/features/products/components/ProductCardSkeleton.tsx`

```typescript
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0">
        <Skeleton className="h-6 w-20" />
      </CardFooter>
    </Card>
  )
}
```

### 4. `src/features/products/components/ProductFilters.tsx`

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

const BRANDS = ['Nike', 'Adidas', 'Converse', 'Vans', 'Puma', 'ASICS', 'New Balance']
const SIZES = ['6', '7', '8', '9', '10', '11', '12']

interface Props {
  brand: string
  size: string
  onBrandChange: (value: string) => void
  onSizeChange: (value: string) => void
  onClear: () => void
}

export function ProductFilters({ brand, size, onBrandChange, onSizeChange, onClear }: Props) {
  const hasFilters = brand || size

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <Select value={brand || 'all'} onValueChange={(v) => onBrandChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="All Brands" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Brands</SelectItem>
          {BRANDS.map((b) => (
            <SelectItem key={b} value={b}>{b}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={size || 'all'} onValueChange={(v) => onSizeChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="All Sizes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sizes</SelectItem>
          {SIZES.map((s) => (
            <SelectItem key={s} value={s}>UK {s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  )
}
```

### 5. `src/features/products/components/SizeSelector.tsx`

```typescript
import { cn } from '@/lib/utils'

interface Props {
  sizesCsv: string
  selectedSize: string
  onSelect: (size: string) => void
}

export function SizeSelector({ sizesCsv, selectedSize, onSelect }: Props) {
  const sizes = sizesCsv ? sizesCsv.split(',').map((s) => s.trim()) : []

  if (sizes.length === 0) {
    return <p className="text-sm text-muted-foreground">No sizes available</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onSelect(size)}
          className={cn(
            'h-10 w-12 rounded-md border text-sm font-medium transition-colors',
            selectedSize === size
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
          )}
        >
          UK {size}
        </button>
      ))}
    </div>
  )
}
```

### 6. `src/features/products/pages/ProductListPage.tsx`

```typescript
import { useState } from 'react'
import { ProductCard } from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton'
import { ProductFilters } from '../components/ProductFilters'
import { useProducts } from '../hooks/useProducts'
import { AlertCircle } from 'lucide-react'

export default function ProductListPage() {
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')

  const { data: products, isLoading, isError } = useProducts({ brand, size })

  const handleClear = () => {
    setBrand('')
    setSize('')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Sneakers</h1>
        <p className="text-muted-foreground mt-1">Find your next pair</p>
      </div>

      <div className="mb-6">
        <ProductFilters
          brand={brand}
          size={size}
          onBrandChange={setBrand}
          onSizeChange={setSize}
          onClear={handleClear}
        />
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6">
          <AlertCircle className="h-4 w-4" />
          Failed to load products. Please try again.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">No sneakers found</p>
          {(brand || size) && (
            <button
              onClick={handleClear}
              className="mt-2 text-sm underline hover:text-foreground"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

### 7. `src/features/products/pages/ProductDetailPage.tsx`

```typescript
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { SizeSelector } from '../components/SizeSelector'
import { useProduct } from '../hooks/useProducts'
import { useCartStore } from '@/features/cart/cart.store'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const addItem = useCartStore((s) => s.addItem)

  const [selectedSize, setSelectedSize] = useState('')

  const { data: product, isLoading, isError } = useProduct(id!)

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({
        title: 'Please select a size',
        variant: 'destructive',
      })
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
      quantity: 1,
    })

    toast({
      title: 'Added to cart',
      description: `${product.name} (UK ${selectedSize})`,
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">Product not found</p>
          <Button variant="outline" asChild>
            <Link to="/">Back to catalog</Link>
          </Button>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.stockQty === 0

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6 -ml-2 gap-1"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
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

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <Badge variant="outline" className="mb-2">{product.brand}</Badge>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-2 text-2xl font-semibold">₹{product.price.toFixed(2)}</p>
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {isOutOfStock ? (
            <Badge variant="secondary" className="w-fit text-sm py-1 px-3">Out of Stock</Badge>
          ) : (
            <>
              <div>
                <p className="mb-3 text-sm font-medium">Select Size</p>
                <SizeSelector
                  sizesCsv={product.sizesCsv ?? ''}
                  selectedSize={selectedSize}
                  onSelect={setSelectedSize}
                />
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </Button>
            </>
          )}

          <p className="text-xs text-muted-foreground">
            {product.stockQty > 0 ? `${product.stockQty} units in stock` : 'Currently out of stock'}
          </p>
        </div>
      </div>
    </div>
  )
}
```

### 8. Add Toaster to `App.tsx` or `RootLayout.tsx`

```typescript
// In RootLayout.tsx, add to JSX:
import { Toaster } from '@/components/ui/toaster'

// Inside the return, after <Outlet />:
<Toaster />
```

---

## Behavior Specification

### Product List Page

```
On mount:
  → TanStack Query fetches GET /api/products
  → While loading: show 8 skeleton cards in grid
  → On success: render product cards
  → On error: show error banner above grid

Filter interaction:
  → User selects brand from dropdown
  → Query key changes → TanStack Query fetches GET /api/products?brand=Nike
  → Grid updates with filtered results
  → If no results: show "No sneakers found" + "Clear filters" button
  → Selecting both brand + size → both applied as query params

Product card click:
  → Navigate to /products/{id}
```

### Product Detail Page

```
On mount with id param:
  → Fetch GET /api/products/{id}
  → While loading: show skeleton layout
  → On error/not found: show "Product not found" with back button
  → On success: render full product info

Size selection:
  → Clicking a size button marks it as selected (visual highlight)
  → Only one size can be selected at a time

"Add to Cart" button:
  → If no size selected → toast "Please select a size" (no API call)
  → If size selected → call cartStore.addItem()
  → Toast "Added to cart — Air Max 90 (UK 9)"
  → Button does NOT navigate away

Out of stock:
  → No size selector rendered
  → "Out of Stock" badge shown instead of Add to Cart button
```

---

## Manual Verification Steps

```
1. Open http://localhost:5173
   - See 10 product cards in grid
   - Loading skeletons appear before data
   - Cards show image, brand, name, price

2. Filter by brand "Nike"
   - Grid shows only Nike products (3 cards: Air Max 90, Air Force 1, Dunk Low)

3. Filter by size "11"
   - Grid shows only products with size 11

4. Filter brand=Nike + size=11
   - Grid shows intersection

5. Click "Clear" — both filters reset, all products shown

6. Click a product card → navigate to /products/{id}
   - Large image, brand badge, name, description, price visible
   - Size buttons render (UK 7, UK 8, etc.)
   - No size selected: "Add to Cart" button is enabled (validation on click)

7. Click "Add to Cart" without selecting size → toast error

8. Select size UK 9 → button highlights, click "Add to Cart" → success toast
   - Cart badge in header shows 1

9. Go back → product list retains previous filters (no refetch due to cache)

10. Click a product with 0 stock → shows "Out of Stock" badge, no size/cart button
```

---

## Acceptance Criteria

- [ ] Product list shows loading skeletons while fetching
- [ ] Product list shows all 10 seeded products
- [ ] Brand filter fetches with `?brand=Nike` and shows only Nike products
- [ ] Size filter fetches with `?size=11` and shows correct products
- [ ] Both filters applied together work correctly
- [ ] Empty filter results show "No sneakers found" state
- [ ] Clicking a product navigates to `/products/{id}`
- [ ] Product detail shows image, brand, name, description, price, sizes
- [ ] Selecting a size highlights it visually
- [ ] Adding to cart without size selection shows toast error
- [ ] Adding to cart with valid size shows success toast
- [ ] Header cart badge increments after adding
- [ ] Out-of-stock products show badge, no size selector or add-to-cart button
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
