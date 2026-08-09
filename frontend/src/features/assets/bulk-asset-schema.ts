import { z } from 'zod'

export const bulkAssetFormSchema = z.object({
  asset_type_id: z.number({ error: 'Выберите тип актива' }).int().positive(),
  template: z.string().min(1, 'Укажите шаблон'),
  separator: z.string().min(1, 'Укажите разделитель'),
  raw_text: z.string().min(1, 'Введите хотя бы одну строку'),
})

export type BulkAssetFormValues = z.infer<typeof bulkAssetFormSchema>
