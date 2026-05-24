# SPEC-08: Shopping Cart — Frontend

**Status:** `[ ] Not Started`  
**Depends on:** SPEC-05 (cart store already defined), SPEC-07 (product pages add to cart)  
**Blocks:** SPEC-09 (checkout reads from cart)  

---

## Overview

Build the CartPage (full view at `/cart`) and the CartDrawer (slide-in panel accessible from the header cart icon). Both read from the Zustand cart store. No backend involvement — cart is fully client-side with localStorage persistence. The CartPage has a "Proceed to Checkout" CTA that navigates to `/checkout`.

---

## Files to Implement

```
features/cart/
  ├── cart.store.ts              (already done in SPEC-05)
  ├── components/
  │   ├── CartDrawer.tsx         # Slide-in from right (shadcn Sheet)
  │   ├── CartItem.tsx           # Single item row component
  │   └── CartSummary.tsx        # Total + checkout CTA
  └── pages/
      └── CartPage.tsx           # Full-page cart at /cart
```

Update `Header.tsx` to open `CartDrawer`.

---

## Implementation

### 1. `src/features/cart/components/CartItem.tsx`

```typescript
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-50">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No img
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-sm text-muted-foreground">{item.brand}</p>
        <p className="font-medium leading-tight">{item.name}</p>
        <p className="text-sm text-muted-foreground">Size: UK {item.size}</p>

        <div className="mt-auto flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                updateQuantity(item.productId, item.size, item.quantity - 1)
              }
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                updateQuantity(item.productId, item.size, item.quantity + 1)
              }
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Price + delete */}
          <div className="flex items-center gap-3">
            <p className="font-semibold">
              ₹{(item.price * item.quantity).toFixed(2)}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(item.productId, item.size)}
              aria-label={`Remove ${item.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 2. `src/features/cart/components/CartSummary.tsx`

```typescript
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useCartStore } from '../cart.store'

interface Props {
  onCheckout?: () => void  // optional: close drawer before navigating
}

export function CartSummary({ onCheckout }: Props) {
  const totalPrice = useCartStore((s) => s.totalPrice())
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex items-center justify-between font-medium">
        <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
        <span className="text-lg font-bold">₹{totalPrice.toFixed(2)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Shipping & taxes calculated at checkout
      </p>
      <Button className="w-full" size="lg" asChild onClick={onCheckout}>
        <Link to="/checkout">Proceed to Checkout</Link>
      </Button>
    </div>
  )
}
```

### 3. `src/features/cart/components/CartDrawer.tsx`

```typescript
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, ShoppingBag } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CartItem } from './CartItem'
import { CartSummary } from './CartSummary'
import { useCartStore } from '../cart.store'

export function CartDrawer() {
  const [open, setOpen] = useState(false)
  const items = useCartStore((s) => s.items)
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
              {totalItems > 99 ? '99+' : totalItems}
            </Badge>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>

      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart ({totalItems})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">
              Add some sneakers to get started
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem
                    key={`${item.productId}-${item.size}`}
                    item={item}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="pt-4">
              <CartSummary onCheckout={() => setOpen(false)} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

### 4. Update `Header.tsx` to Use `CartDrawer`

Replace the existing cart icon button in `Header.tsx`:

```typescript
// Remove:
<Button variant="ghost" size="icon" asChild>
  <Link to="/cart" className="relative">
    <ShoppingCart className="h-5 w-5" />
    {totalItems > 0 && (
      <Badge ...>{totalItems}</Badge>
    )}
  </Link>
</Button>

// Add:
import { CartDrawer } from '@/features/cart/components/CartDrawer'
// ...
<CartDrawer />
```

Also remove the `useCartStore` import from `Header.tsx` since `CartDrawer` handles it internally.

### 5. `src/features/cart/pages/CartPage.tsx`

```typescript
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CartItem } from '../components/CartItem'
import { CartSummary } from '../components/CartSummary'
import { useCartStore } from '../cart.store'

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Cart</h1>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-24 text-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          <div>
            <p className="text-xl font-semibold">Your cart is empty</p>
            <p className="mt-1 text-muted-foreground">
              Looks like you haven't added anything yet.
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Browse Sneakers
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items list */}
          <div className="lg:col-span-2">
            <div className="divide-y rounded-lg border p-4">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.size}`}
                  item={item}
                />
              ))}
            </div>
          </div>

          {/* Summary sidebar */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-4">Order Summary</h2>
              <CartSummary />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 6. Add Additional shadcn/ui Components

```bash
cd frontend
pnpm dlx shadcn@latest add scroll-area separator
```

---

## Behavior Specification

### Cart Drawer (from Header)

```
Click cart icon in header:
  → Sheet slides in from right
  → If empty: shows empty state with "Continue Shopping" button
  → If has items: scrollable list of CartItem components + CartSummary at bottom

Per CartItem row:
  → Thumbnail + brand + name + size shown
  → Minus button: decrements quantity; if quantity reaches 0, item is removed
  → Plus button: increments quantity; subtotal updates instantly
  → Delete icon: removes item from cart; if last item, drawer shows empty state
  → Price shown as (unit price × quantity)

CartSummary:
  → Shows total item count + total price
  → "Proceed to Checkout" button → closes drawer + navigates to /checkout
```

### Cart Page (`/cart`)

```
If empty:
  → Full-page empty state with icon + "Browse Sneakers" CTA
  → No "Clear all" button

If has items:
  → Two-column layout on desktop (items | summary)
  → Single column on mobile
  → Same CartItem controls as drawer
  → "Clear all" button in header removes all items
  → CartSummary with "Proceed to Checkout" → navigates to /checkout
```

### Quantity Behavior

```
quantity = 3 → click Minus → quantity = 2
quantity = 1 → click Minus → item removed from cart
Removing last item → drawer/page shows empty state
```

---

## Manual Verification Steps

```
1. Open product list, add Air Max 90 (UK 9) to cart
   - Header badge shows 1
   - Click cart icon → drawer opens with 1 item

2. In drawer, click Plus → quantity = 2, price doubles, badge shows 2

3. In drawer, click Minus on quantity 2 → quantity = 1

4. In drawer, click Minus on quantity 1 → item removed, drawer shows empty state

5. Add 3 different products with different sizes
   - Cart badge shows 3
   - Drawer shows all 3 items
   - Subtotal = sum of all items

6. Click "Proceed to Checkout" in drawer
   - Drawer closes
   - Navigation to /checkout (or /login if not authenticated)

7. Navigate to /cart directly
   - Full-page cart with same items (LocalStorage persisted)
   - Refresh page → items still there (Zustand persist)

8. Click "Clear all" → empty cart state shown

9. Refresh with empty cart → empty state persists
```

---

## Acceptance Criteria

- [ ] Cart drawer opens when clicking cart icon in header
- [ ] Drawer shows empty state when cart is empty
- [ ] Drawer shows item list with quantity controls when cart has items
- [ ] Quantity increment/decrement updates subtotal instantly (no API call)
- [ ] Decrementing quantity to 0 removes item
- [ ] Delete button removes item from cart
- [ ] After removing last item, empty state is shown
- [ ] Header badge count updates reactively with cart changes
- [ ] "Proceed to Checkout" in drawer closes drawer and navigates to `/checkout`
- [ ] `/cart` full page shows same cart contents
- [ ] Cart contents persist after page refresh (localStorage)
- [ ] "Clear all" on cart page removes all items
- [ ] Price calculations are correct (unit × quantity, summed correctly)
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
