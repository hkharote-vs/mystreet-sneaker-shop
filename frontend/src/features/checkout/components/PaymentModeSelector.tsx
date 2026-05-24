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
    description: 'Pay when your order arrives at your door',
    emoji: '💵',
  },
  {
    id: 'MOCK_UPI' as const,
    label: 'Mock UPI',
    description: 'Simulated instant UPI payment',
    emoji: '📱',
  },
]

export function PaymentModeSelector({ register, errors, selectedMode }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-zinc-950">Payment Method</h2>
        <p className="text-sm text-zinc-400 mt-0.5">All payments are simulated — no real money</p>
      </div>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.id
          return (
            <Label
              key={option.id}
              htmlFor={option.id}
              className={cn(
                'flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-150',
                isSelected
                  ? 'border-zinc-950 bg-zinc-50 shadow-sm'
                  : 'border-zinc-200 bg-white hover:border-zinc-400',
              )}
            >
              <input
                id={option.id}
                type="radio"
                value={option.id}
                {...register('paymentMode')}
                className="sr-only"
              />
              <span className="text-2xl select-none">{option.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-zinc-900">{option.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{option.description}</p>
              </div>
              <div
                className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                  isSelected
                    ? 'border-zinc-950 bg-zinc-950'
                    : 'border-zinc-300 bg-white',
                )}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-white block" />}
              </div>
            </Label>
          )
        })}
      </div>

      {errors.paymentMode && (
        <p className="text-xs font-semibold text-red-500">{errors.paymentMode.message}</p>
      )}
    </div>
  )
}
