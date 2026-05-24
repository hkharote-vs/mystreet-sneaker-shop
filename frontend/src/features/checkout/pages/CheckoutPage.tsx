import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft, ShoppingBag, Lock } from 'lucide-react'
import type { AxiosError } from 'axios'
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
        <div className="inline-flex items-center justify-center rounded-full bg-zinc-100 p-8 mb-6">
          <ShoppingBag className="h-12 w-12 text-zinc-400" />
        </div>
        <p className="text-xl font-black text-zinc-900">Your cart is empty</p>
        <p className="text-zinc-400 mt-1 text-sm">Add some sneakers before checking out.</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full bg-zinc-950 px-6 py-2.5 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
        >
          Browse Sneakers
        </Link>
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
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </button>

        <h1 className="mb-10 text-4xl font-black text-zinc-950 tracking-tight">Checkout</h1>

        {apiErrorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-semibold mb-8">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {apiErrorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Left: Forms */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border-2 border-zinc-100 bg-white p-6">
                <ShippingForm register={register} errors={errors} />
              </div>

              <div className="rounded-2xl border-2 border-zinc-100 bg-white p-6">
                <PaymentModeSelector
                  register={register}
                  errors={errors}
                  selectedMode={selectedPaymentMode}
                />
              </div>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border-2 border-zinc-100 bg-white p-6 sticky top-24 space-y-5">
                <h2 className="text-lg font-black text-zinc-950">Order Summary</h2>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="flex justify-between items-start gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-800 truncate">{item.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">UK {item.size} · Qty {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-zinc-100 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-zinc-500">Subtotal</span>
                    <span className="text-sm font-semibold text-zinc-700">₹{totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-sm font-semibold text-zinc-500">Delivery</span>
                    <span className="text-sm font-bold text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-zinc-100">
                    <span className="text-base font-black text-zinc-950">Total</span>
                    <span className="text-xl font-black text-zinc-950">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-14 rounded-2xl bg-zinc-950 text-white text-sm font-black uppercase tracking-widest hover:bg-orange-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Placing Order…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Place Order
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-zinc-400">
                  Mock checkout — no real payment processed
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
