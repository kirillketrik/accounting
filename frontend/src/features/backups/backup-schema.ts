import { z } from 'zod'

export const recipientFormSchema = z.object({
  chat_id: z.string().min(1, 'Укажите chat_id').max(64),
  label: z.string().max(100).optional(),
})

export type RecipientFormValues = z.infer<typeof recipientFormSchema>
