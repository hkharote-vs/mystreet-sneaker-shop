import { z } from 'zod'

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().min(1, 'Brand is required'),
  description: z.string().optional(),
  price: z
    .number({ error: 'Price must be a number' })
    .positive('Price must be greater than 0'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  sizesCsv: z.string().optional(),
  stockQty: z
    .number({ error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
})

export type ProductFormData = z.infer<typeof productFormSchema>
