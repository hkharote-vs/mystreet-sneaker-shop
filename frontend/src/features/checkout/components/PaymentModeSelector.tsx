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
    id: 'MOCK_COD' as const,
    label: 'Cash on Delivery',
    description: 'Pay when your order arrives',
    emoji: '💵',
  },
  {
    id: 'MOCK_UPI' as const,
    label: 'Mock UPI',
    description: 'Simulated instant payment',
    emoji: '📱',
  },
]

export function PaymentModeSelector({ register, errors, selectedMode }: Props) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold gradient-text">Payment Method</h2>
      <p className="text-xs text-muted-foreground">
        All payments are simulated — no real money involved
      </p>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.id
          return (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all duration-200',
                isSelected
                  ? 'border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8',
              )}
            >
              <input
                id={option.id}
                type="radio"
                value={option.id}
                {...register('paymentMode')}
                className="sr-only"
              />
              <span className="text-2xl">{option.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              <div
                className={cn(
                  'h-4 w-4 rounded-full border-2 transition-all',
                  isSelected
                    ? 'border-violet-500 bg-violet-500'
                    : 'border-slate-500',
                )}
              />
            </Label>
          )
        })}
      </div>

      {errors.paymentMode && (
        <p className="text-xs text-red-400">{errors.paymentMode.message}</p>
      )}
    </div>
  )
}
