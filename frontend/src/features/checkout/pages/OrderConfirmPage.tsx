import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, AlertCircle, MapPin, CreditCard } from 'lucide-react'
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
        <div className="text-center space-y-3">
          <Skeleton className="h-14 w-14 rounded-full mx-auto" />
          <Skeleton className="h-9 w-64 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
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
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
          <CheckCircle2 className="h-10 w-10 text-green-400" />
        </div>
        <h1 className="text-3xl font-black gradient-text">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you! Your sneakers are on their way.
        </p>
      </div>

      {/* Order card */}
      <div className="glass rounded-2xl gradient-border p-6 space-y-6">
        {/* Order ID + status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Order ID</p>
            <p className="font-mono text-sm text-slate-300 break-all">{order.id}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{order.status}</Badge>
        </div>

        <Separator />

        {/* Items */}
        <div>
          <h2 className="flex items-center gap-2 font-bold mb-4">
            <Package className="h-4 w-4 text-violet-400" />
            Items Ordered
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm gap-3">
                <span className="text-muted-foreground">
                  {item.productName}{' '}
                  <span className="text-slate-500">(UK {item.size}) ×{item.quantity}</span>
                </span>
                <span className="font-semibold shrink-0 gradient-text">
                  ₹{item.subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total Paid</span>
          <span className="gradient-text">₹{order.totalAmount.toLocaleString('en-IN')}</span>
        </div>

        <Separator />

        {/* Shipping */}
        <div>
          <h2 className="flex items-center gap-2 font-bold mb-3">
            <MapPin className="h-4 w-4 text-violet-400" />
            Shipping To
          </h2>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p className="font-semibold text-foreground">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.addressLine}</p>
            <p>{order.shippingAddress.city} — {order.shippingAddress.pin}</p>
            <p>+91 {order.shippingAddress.phone}</p>
          </div>
        </div>

        <Separator />

        {/* Payment */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            Payment Method
          </span>
          <span className="font-semibold">
            {order.paymentMode === 'MOCK_COD' ? '💵 Cash on Delivery' : '📱 Mock UPI'}
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8">
        <Button asChild size="lg" className="w-full">
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
