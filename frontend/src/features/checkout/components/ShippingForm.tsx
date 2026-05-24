import type { UseFormRegister, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CheckoutFormData } from '../checkout.schemas'

interface Props {
  register: UseFormRegister<CheckoutFormData>
  errors: FieldErrors<CheckoutFormData>
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-zinc-800">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  )
}

export function ShippingForm({ register, errors }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-zinc-950">Shipping Address</h2>
        <p className="text-sm text-zinc-400 mt-0.5">Where should we deliver your order?</p>
      </div>

      <Field id="shippingName" label="Full Name" error={errors.shippingName?.message}>
        <Input
          id="shippingName"
          placeholder="e.g. Rahul Sharma"
          className="h-12 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-900 focus-visible:ring-0"
          aria-invalid={!!errors.shippingName}
          {...register('shippingName')}
        />
      </Field>

      <Field id="shippingAddressLine" label="Address" error={errors.shippingAddressLine?.message}>
        <Input
          id="shippingAddressLine"
          placeholder="e.g. Flat 4B, MG Road"
          className="h-12 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-900 focus-visible:ring-0"
          aria-invalid={!!errors.shippingAddressLine}
          {...register('shippingAddressLine')}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field id="shippingCity" label="City" error={errors.shippingCity?.message}>
          <Input
            id="shippingCity"
            placeholder="Mumbai"
            className="h-12 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-900 focus-visible:ring-0"
            aria-invalid={!!errors.shippingCity}
            {...register('shippingCity')}
          />
        </Field>

        <Field id="shippingPin" label="PIN Code" error={errors.shippingPin?.message}>
          <Input
            id="shippingPin"
            placeholder="400001"
            maxLength={6}
            className="h-12 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-900 focus-visible:ring-0"
            aria-invalid={!!errors.shippingPin}
            {...register('shippingPin')}
          />
        </Field>
      </div>

      <Field id="shippingPhone" label="Phone Number" error={errors.shippingPhone?.message}>
        <Input
          id="shippingPhone"
          type="tel"
          placeholder="9876543210"
          maxLength={10}
          className="h-12 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-300 focus:border-zinc-900 focus-visible:ring-0"
          aria-invalid={!!errors.shippingPhone}
          {...register('shippingPhone')}
        />
      </Field>
    </div>
  )
}
