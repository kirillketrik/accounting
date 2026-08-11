import { z } from 'zod'

export const recipientFormSchema = z.object({
  recipient_identifier: z.string().min(1, 'Укажите получателя').max(2000),
  label: z.string().max(100).optional(),
})

export type RecipientFormValues = z.infer<typeof recipientFormSchema>
