import { z } from 'zod'

export const eventTypeFormSchema = z.object({
  name: z.string().min(1, 'Укажите название').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  target_status_id: z.number({ error: 'Выберите статус' }).int().positive(),
  counter_label: z.string().max(200).optional().or(z.literal('')),
})

export type EventTypeFormValues = z.infer<typeof eventTypeFormSchema>
