import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useCartStore } from '../cart.store'

interface Props {
  onCheckout?: () => void
}

export function CartSummary({ onCheckout }: Props) {
  const totalPrice = useCartStore((s) => s.totalPrice())
  const totalItems = useCartStore((s) => s.totalItems())

  return (
    <div className="space-y-4">
      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </span>
        <span className="text-xl font-bold gradient-text">
          ₹{totalPrice.toLocaleString('en-IN')}
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Shipping &amp; taxes calculated at checkout
      </p>

      <Button className="w-full gap-2" size="lg" asChild onClick={onCheckout}>
        <Link to="/checkout">
          Proceed to Checkout
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}
