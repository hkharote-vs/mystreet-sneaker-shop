import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ShoppingBag } from 'lucide-react'
import type { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ShippingForm } from '../components/ShippingForm'
import { PaymentModeSelector } from '../components/PaymentModeSelector'
import { checkoutSchema, type CheckoutFormData } from '../checkout.schemas'
import { usePlaceOrder } from '../hooks/useOrders'
import { useCartStore } from '@/features/cart/cart.store'
import type { ApiError } from '@/types'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore((s) => s.items)
  const totalPrice = useCartStore((s) => s.totalPrice())
  const clearCart = useCartStore((s) => s.clearCart)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutFormData>({ resolver: zodResolver(checkoutSchema) })

  const selectedPaymentMode = useWatch({ control, name: 'paymentMode' })
  const { mutate: placeOrder, isPending, error } = usePlaceOrder()

  const apiErrorMessage = (error as AxiosError<ApiError>)?.response?.data?.message ?? null

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="rounded-full glass p-8 w-fit mx-auto mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <p className="text-xl font-bold">Your cart is empty</p>
        <p className="text-muted-foreground mt-1">Add some sneakers before checking out.</p>
        <Button asChild className="mt-6">
          <Link to="/">Browse Sneakers</Link>
        </Button>
      </div>
    )
  }

  const onSubmit = (formData: CheckoutFormData) => {
    placeOrder(
      {
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
      },
      {
        onSuccess: (order) => {
          clearCart()
          navigate(`/orders/confirm/${order.id}`)
        },
      },
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </button>

      <h1 className="mb-8 text-4xl font-black gradient-text">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Forms */}
          <div className="space-y-8 lg:col-span-2">
            {apiErrorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {apiErrorMessage}
              </div>
            )}

            <div className="glass rounded-2xl p-6 gradient-border space-y-0">
              <ShippingForm register={register} errors={errors} />
            </div>

            <div className="glass rounded-2xl p-6 gradient-border">
              <PaymentModeSelector
                register={register}
                errors={errors}
                selectedMode={selectedPaymentMode}
              />
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 gradient-border sticky top-24 space-y-4">
              <h2 className="font-bold text-lg">Order Summary</h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.size}`}
                    className="flex justify-between text-sm gap-2"
                  >
                    <span className="text-muted-foreground truncate">
                      {item.name} <span className="text-slate-500">(UK {item.size}) ×{item.quantity}</span>
                    </span>
                    <span className="font-semibold shrink-0">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="gradient-text">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                {isPending ? 'Placing Order...' : 'Place Order'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure mock checkout — no real payment
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
