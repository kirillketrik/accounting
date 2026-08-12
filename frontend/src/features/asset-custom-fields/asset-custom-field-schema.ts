import { z } from 'zod'

export const CUSTOM_FIELD_TYPE_LABELS = {
  text: 'Текст',
  number: 'Число',
  date: 'Дата',
  boolean: 'Да/Нет',
} as const

export const assetCustomFieldFormSchema = z.object({
  asset_type_id: z.number({ error: 'Выберите тип актива' }).int().positive(),
  name: z.string().min(1, 'Укажите название поля').max(255),
  field_type: z.enum(['text', 'number', 'date', 'boolean'], { error: 'Выберите тип поля' }),
  is_required: z.boolean(),
})

export type AssetCustomFieldFormValues = z.infer<typeof assetCustomFieldFormSchema>
