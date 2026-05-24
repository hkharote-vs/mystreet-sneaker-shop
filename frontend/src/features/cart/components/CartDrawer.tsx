import { useState } from 'react'
import { ShoppingCart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
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
        <button
          className="relative rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-lg shadow-violet-500/50">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="gradient-text">
            Cart {totalItems > 0 && `(${totalItems})`}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-16">
            <div className="rounded-full bg-white/5 p-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add some sneakers to get started</p>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/15 hover:bg-white/10">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="divide-y divide-white/10">
                {items.map((item) => (
                  <CartItem key={`${item.productId}-${item.size}`} item={item} />
                ))}
              </div>
            </ScrollArea>

            <div className="pt-2">
              <CartSummary onCheckout={() => setOpen(false)} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
