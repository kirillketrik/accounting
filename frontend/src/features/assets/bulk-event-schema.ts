import { z } from 'zod'

export const bulkEventFormSchema = z.object({
  event_type_id: z.number({ error: 'Выберите тип события' }).int().positive(),
  event_date: z.string().min(1, 'Укажите дату и время'),
  performed_by: z.string().max(200).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  separator: z.string().min(1, 'Укажите разделитель'),
  raw_text: z.string().min(1, 'Введите хотя бы один инвентарный номер'),
})

export type BulkEventFormValues = z.infer<typeof bulkEventFormSchema>
