import { z } from 'zod'
import { OUTING_CATEGORIES } from '../types/outing.types'

export const outingSchema = z.object({
  title: z.string().min(1, 'validation.required'),
  description: z.string().min(1, 'validation.required'),
  category: z.enum(OUTING_CATEGORIES),
  date: z.string().min(1, 'validation.required'),
  start_time: z.string().min(1, 'validation.required'),
  end_time: z.string().min(1, 'validation.required'),
  max_participants: z.coerce.number().int().positive('validation.maxParticipants'),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  address: z.string().min(1, 'validation.required'),
  cover_image: z.string().optional(),
})

export type OutingFormValues = z.infer<typeof outingSchema>
