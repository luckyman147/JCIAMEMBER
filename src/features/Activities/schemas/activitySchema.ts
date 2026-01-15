import * as z from 'zod'

export const activitySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  type: z.enum(['event', 'formation', 'meeting', 'general_assembly']),
  activity_address: z.string().optional(),
  is_online: z.boolean().default(false),
  online_link: z.string().url('Invalid URL').optional().or(z.literal('')),
  activity_begin_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  activity_end_date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
  activity_points: z.coerce.number().min(0).default(0),
  is_paid: z.boolean().default(false),
  price: z.coerce.number().min(0).optional(),
  is_public: z.boolean().default(true),
  image_url: z.string().optional(),
  recap_images: z.array(z.string()).optional(),
  // Type-specific fields (all optional)
  registration_deadline: z.string().optional(),
  meeting_plan: z.string().optional(),
  pv_attachments: z.string().optional(),
  trainer_name: z.string().optional(),
  course_attachment: z.string().optional(),
  training_type: z.enum(['official_session', 'important_training', 'just_training', 'member_to_member']).optional(),
  assembly_type: z.enum(['local', 'zonal', 'national', 'international']).optional(),
}).refine((data) => {
  if (data.is_paid && (data.price === undefined || data.price < 0)) {
    return false
  }
  return true
}, {
  message: "Price is required for paid activities",
  path: ["price"],
}).refine((data) => {
  const startDate = new Date(data.activity_begin_date)
  const endDate = new Date(data.activity_end_date)
  return endDate > startDate
}, {
  message: "End date must be later than start date",
  path: ["activity_end_date"],
})

export type ActivityFormValues = z.infer<typeof activitySchema>

