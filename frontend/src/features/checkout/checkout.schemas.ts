import { z } from 'zod'

export const checkoutSchema = z.object({
  shippingName: z.string().min(1, 'Full name is required'),
  shippingAddressLine: z.string().min(1, 'Address is required'),
  shippingCity: z.string().min(1, 'City is required'),
  shippingPin: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
  shippingPhone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  paymentMode: z.enum(['MOCK_COD', 'MOCK_UPI'], {
    error: 'Please select a payment method',
  }),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>
