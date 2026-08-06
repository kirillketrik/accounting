import { z } from 'zod'

export const typeFormSchema = z.object({
  name: z.string().min(1, 'Укажите название').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
})

export type TypeFormValues = z.infer<typeof typeFormSchema>
