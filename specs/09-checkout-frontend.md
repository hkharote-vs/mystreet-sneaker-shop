# SPEC-09: Checkout & Order Confirmation — Frontend

**Status:** `[x] Complete`  
**Depends on:** SPEC-05, SPEC-06 (auth), SPEC-08 (cart store), SPEC-04 (order backend)  
**Blocks:** Nothing (final user-facing flow)  

---

## Overview

Build the `CheckoutPage` and `OrderConfirmPage`. The checkout page collects shipping info and payment mode, then submits the cart items to `POST /api/orders`. On success, it clears the cart and redirects to the order confirmation page. The confirm page fetches and displays the order detail.

---

## Files to Implement

```
features/checkout/
  ├── hooks/
  │   └── useOrders.ts                  # TanStack Query mutation + query
  ├── components/
  │   ├── ShippingForm.tsx              # React Hook Form section
  │   └── PaymentModeSelector.tsx       # Radio group for COD/UPI
  └── pages/
      ├── CheckoutPage.tsx
      └── OrderConfirmPage.tsx
```

---

## Implementation

### 1. `src/features/checkout/hooks/useOrders.ts`

```typescript
import { useMutation, useQuery } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders.api'

export const ORDER_KEYS = {
  all: ['orders'] as const,
  mine: () => [...ORDER_KEYS.all, 'mine'] as const,
  detail: (id: string) => [...ORDER_KEYS.all, 'detail', id] as const,
}

export function usePlaceOrder() {
  return useMutation({
    mutationFn: ordersApi.place,
  })
}

export function useOrderDetail(id: string) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  })
}

export function useMyOrders() {
  return useQuery({
    queryKey: ORDER_KEYS.mine(),
    queryFn: ordersApi.mine,
  })
}
```

### 2. Zod Schemas (`src/features/checkout/checkout.schemas.ts`)

```typescript
import { z } from 'zod'

export const checkoutSchema = z.object({
  shippingName: z.string().min(1, 'Full name is required'),
  shippingAddressLine: z.string().min(1, 'Address is required'),
  shippingCity: z.string().min(1, 'City is required'),
  shippingPin: z
    .string()
    .regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  shippingPhone: z
    .string()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  paymentMode: z.enum(['MOCK_COD', 'MOCK_UPI'], {
    required_error: 'Please select a payment method',
  }),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>
```

### 3. `src/features/checkout/components/ShippingForm.tsx`

```typescript
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CheckoutFormData } from '../checkout.schemas'

interface Props {
  register: UseFormRegister<CheckoutFormData>
  errors: FieldErrors<CheckoutFormData>
}

export function ShippingForm({ register, errors }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Shipping Address</h2>

      <div className="space-y-1">
        <Label htmlFor="shippingName">Full Name</Label>
        <Input
          id="shippingName"
          placeholder="John Doe"
          {...register('shippingName')}
          aria-invalid={!!errors.shippingName}
        />
        {errors.shippingName && (
          <p className="text-xs text-destructive">{errors.shippingName.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="shippingAddressLine">Address</Label>
        <Input
          id="shippingAddressLine"
          placeholder="123 Street Name, Apartment"
          {...register('shippingAddressLine')}
          aria-invalid={!!errors.shippingAddressLine}
        />
        {errors.shippingAddressLine && (
          <p className="text-xs text-destructive">{errors.shippingAddressLine.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="shippingCity">City</Label>
          <Input
            id="shippingCity"
            placeholder="Mumbai"
            {...register('shippingCity')}
            aria-invalid={!!errors.shippingCity}
          />
          {errors.shippingCity && (
            <p className="text-xs text-destructive">{errors.shippingCity.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="shippingPin">PIN Code</Label>
          <Input
            id="shippingPin"
            placeholder="400001"
            maxLength={6}
            {...register('shippingPin')}
            aria-invalid={!!errors.shippingPin}
          />
          {errors.shippingPin && (
            <p className="text-xs text-destructive">{errors.shippingPin.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="shippingPhone">Phone Number</Label>
        <Input
          id="shippingPhone"
          type="tel"
          placeholder="9876543210"
          maxLength={10}
          {...register('shippingPhone')}
          aria-invalid={!!errors.shippingPhone}
        />
        {errors.shippingPhone && (
          <p className="text-xs text-destructive">{errors.shippingPhone.message}</p>
        )}
      </div>
    </div>
  )
}
```

### 4. `src/features/checkout/components/PaymentModeSelector.tsx`

```typescript
import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import type { CheckoutFormData } from '../checkout.schemas'
import { cn } from '@/lib/utils'

interface Props {
  register: UseFormRegister<CheckoutFormData>
  errors: FieldErrors<CheckoutFormData>
  selectedMode: string | undefined
}

const PAYMENT_OPTIONS = [
  {
    id: 'MOCK_COD',
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    emoji: '💵',
  },
  {
    id: 'MOCK_UPI',
    label: 'Mock UPI',
    description: 'Simulated instant payment',
    emoji: '📱',
  },
]

export function PaymentModeSelector({ register, errors, selectedMode }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Payment Method</h2>
      <p className="text-xs text-muted-foreground">
        All payments are simulated — no real money involved
      </p>

      <div className="space-y-2">
        {PAYMENT_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors',
              selectedMode === option.id
                ? 'border-primary bg-primary/5'
                : 'border-input hover:bg-accent',
            )}
          >
            <input
              type="radio"
              value={option.id}
              {...register('paymentMode')}
              className="sr-only"
            />
            <span className="text-2xl">{option.emoji}</span>
            <div>
              <p className="font-medium">{option.label}</p>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
            <div
              className={cn(
                'ml-auto h-4 w-4 rounded-full border-2',
                selectedMode === option.id
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground',
              )}
            />
          </label>
        ))}
      </div>

      {errors.paymentMode && (
        <p className="text-xs text-destructive">{errors.paymentMode.message}</p>
      )}
    </div>
  )
}
```

### 5. `src/features/checkout/pages/CheckoutPage.tsx`

```typescript
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShippingForm } from '../components/ShippingForm'
import { PaymentModeSelector } from '../components/PaymentModeSelector'
import { checkoutSchema, type CheckoutFormData } from '../checkout.schemas'
import { usePlaceOrder } from '../hooks/useOrders'
import { useCartStore } from '@/features/cart/cart.store'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCartStore()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
  })

  const selectedPaymentMode = useWatch({ control, name: 'paymentMode' })

  const { mutate: placeOrder, isPending, error } = usePlaceOrder()

  const apiError = error as AxiosError<ApiError> | null
  const apiErrorMessage = apiError?.response?.data?.message ?? null

  // Should not reach here (ProtectedRoute handles it), but guard anyway
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Your cart is empty</p>
        <Button asChild className="mt-4">
          <Link to="/">Browse Sneakers</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = (formData: CheckoutFormData) => {
    const request = {
      items: items.map((item) => ({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      })),
      shippingAddress: {
        name: formData.shippingName,
        addressLine: formData.shippingAddressLine,
        city: formData.shippingCity,
        pin: formData.shippingPin,
        phone: formData.shippingPhone,
      },
      paymentMode: formData.paymentMode,
    }

    placeOrder(request, {
      onSuccess: (order) => {
        clearCart()
        navigate(`/orders/confirm/${order.id}`)
      },
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6 -ml-2 gap-1" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Button>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Forms */}
          <div className="space-y-8 lg:col-span-2">
            {apiErrorMessage && (
              <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {apiErrorMessage}
              </div>
            )}

            <ShippingForm register={register} errors={errors} />

            <Separator />

            <PaymentModeSelector
              register={register}
              errors={errors}
              selectedMode={selectedPaymentMode}
            />
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border p-4 space-y-4">
              <h2 className="font-semibold">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground truncate max-w-[160px]">
                      {item.name} (UK {item.size}) × {item.quantity}
                    </span>
                    <span className="font-medium ml-2 flex-shrink-0">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{totalPrice().toFixed(2)}</span>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending}
              >
                {isPending ? 'Placing Order...' : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
```

### 6. `src/features/checkout/pages/OrderConfirmPage.tsx`

```typescript
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useOrderDetail } from '../hooks/useOrders'

export default function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>()
  const { data: order, isLoading, isError } = useOrderDetail(id!)

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 space-y-6">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-48 mx-auto" />
        <div className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Order not found</p>
        <Button asChild className="mt-4">
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      {/* Success header */}
      <div className="mb-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500" />
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you! Your sneakers are on their way.
        </p>
      </div>

      {/* Order meta */}
      <div className="rounded-lg border p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Order ID
            </p>
            <p className="font-mono font-medium text-sm mt-1">{order.id}</p>
          </div>
          <Badge>{order.status}</Badge>
        </div>

        <Separator />

        {/* Items */}
        <div>
          <h2 className="flex items-center gap-2 font-semibold mb-4">
            <Package className="h-4 w-4" />
            Items Ordered
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productName}{' '}
                  <span className="text-muted-foreground">
                    (UK {item.size}) × {item.quantity}
                  </span>
                </span>
                <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-semibold text-lg">
          <span>Total Paid</span>
          <span>₹{order.totalAmount.toFixed(2)}</span>
        </div>

        <Separator />

        {/* Shipping */}
        <div>
          <h2 className="font-semibold mb-2">Shipping To</h2>
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.addressLine}</p>
            <p>
              {order.shippingAddress.city} — {order.shippingAddress.pin}
            </p>
            <p>+91 {order.shippingAddress.phone}</p>
          </div>
        </div>

        <Separator />

        {/* Payment */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Payment Method</span>
          <span>
            {order.paymentMode === 'MOCK_COD' ? 'Cash on Delivery' : 'Mock UPI'}
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div className="mt-8 flex gap-4">
        <Button asChild className="flex-1">
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
```

---

## Behavior Specification

### Checkout Page

```
Route is protected — unauthenticated users redirected to /login.

On mount:
  → If cart is empty → show empty cart message with "Browse Sneakers" CTA
  → If cart has items → show form + order summary sidebar

Form validation (Zod):
  → All shipping fields required
  → PIN: exactly 6 digits
  → Phone: exactly 10 digits
  → Payment mode: must select one option

Form submission:
  → "Place Order" button clicked
  → Client-side Zod validates all fields
  → If invalid: inline errors on each field, no API call
  → If valid: POST /api/orders
    → Loading state: button text "Placing Order...", button disabled
    → On 201 success:
      → clearCart() (Zustand + localStorage)
      → navigate('/orders/confirm/{orderId}')
    → On 400 INSUFFICIENT_STOCK:
      → Error banner: "Air Max 90 only has 2 in stock (requested 5)"
      → Form stays intact, user can go back to cart to adjust
    → On other errors:
      → Generic error banner with API message
```

### Order Confirm Page

```
On mount:
  → Fetch GET /api/orders/{id}
  → Loading: skeleton layout
  → Success: show full order confirmation
  → Error: "Order not found" state

Confirmation shows:
  → Checkmark icon + "Order Confirmed!" heading
  → Order ID (in monospace font)
  → Status badge ("PLACED")
  → Each item: name + size + quantity + subtotal
  → Grand total
  → Full shipping address
  → Payment method (human-readable)
  → "Continue Shopping" CTA → navigates to /
```

---

## Manual Verification Steps

```
1. Add items to cart (at least 2 products, different sizes)
2. Navigate to /cart → click "Proceed to Checkout"
3. Should redirect to /login if not authenticated
4. Login → redirected back to checkout (or navigate to /checkout manually)
5. Submit empty form → see inline errors on all fields
6. Enter invalid PIN "123" → "must be exactly 6 digits"
7. Enter invalid phone "123456789" (9 digits) → error
8. Fill all fields correctly, select payment mode
9. Click "Place Order" → button shows "Placing Order..."
10. Success → redirected to /orders/confirm/{id}
11. Confirmation page shows:
    - Correct order ID
    - All items ordered with correct sizes and prices
    - Total matches cart total
    - Shipping address exactly as entered
    - Payment mode shown as human-readable text
12. Cart is empty after redirect (badge shows 0)
13. Navigate back to /checkout → shows "cart is empty" state
```

---

## Acceptance Criteria

- [ ] Unauthenticated access to `/checkout` redirects to `/login`
- [ ] Empty cart at `/checkout` shows empty state with back button
- [ ] Submitting blank checkout form shows inline validation errors
- [ ] Invalid PIN (< 6 digits) shows error
- [ ] Invalid phone (< 10 digits) shows error
- [ ] Not selecting payment mode shows error
- [ ] Successful order POST clears cart and navigates to confirm page
- [ ] Order confirm page shows order ID, all items, total, shipping address
- [ ] Cart badge shows 0 after order placement
- [ ] Revisiting `/checkout` after successful order shows empty cart state
- [ ] Insufficient stock error is shown in error banner on checkout page
- [ ] `pnpm run type-check` passes
- [ ] `pnpm run lint` passes
