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
      <h2 className="text-lg font-bold gradient-text">Shipping Address</h2>

      <div className="space-y-1.5">
        <Label htmlFor="shippingName" className="text-slate-300">Full Name</Label>
        <Input
          id="shippingName"
          placeholder="John Doe"
          aria-invalid={!!errors.shippingName}
          {...register('shippingName')}
        />
        {errors.shippingName && (
          <p className="text-xs text-red-400">{errors.shippingName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingAddressLine" className="text-slate-300">Address</Label>
        <Input
          id="shippingAddressLine"
          placeholder="123 Street Name, Apartment"
          aria-invalid={!!errors.shippingAddressLine}
          {...register('shippingAddressLine')}
        />
        {errors.shippingAddressLine && (
          <p className="text-xs text-red-400">{errors.shippingAddressLine.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="shippingCity" className="text-slate-300">City</Label>
          <Input
            id="shippingCity"
            placeholder="Mumbai"
            aria-invalid={!!errors.shippingCity}
            {...register('shippingCity')}
          />
          {errors.shippingCity && (
            <p className="text-xs text-red-400">{errors.shippingCity.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="shippingPin" className="text-slate-300">PIN Code</Label>
          <Input
            id="shippingPin"
            placeholder="400001"
            maxLength={6}
            aria-invalid={!!errors.shippingPin}
            {...register('shippingPin')}
          />
          {errors.shippingPin && (
            <p className="text-xs text-red-400">{errors.shippingPin.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shippingPhone" className="text-slate-300">Phone Number</Label>
        <Input
          id="shippingPhone"
          type="tel"
          placeholder="9876543210"
          maxLength={10}
          aria-invalid={!!errors.shippingPhone}
          {...register('shippingPhone')}
        />
        {errors.shippingPhone && (
          <p className="text-xs text-red-400">{errors.shippingPhone.message}</p>
        )}
      </div>
    </div>
  )
}
