import { z } from 'zod'

export const assetNamingRuleFormSchema = z.object({
  asset_type_id: z.number({ error: 'Выберите тип актива' }).int().positive(),
  serial_number: z.string().min(1, 'Укажите серийный номер').max(100),
  name_result: z.string().min(1, 'Укажите результирующее название').max(200),
  is_active: z.boolean(),
})

export type AssetNamingRuleFormValues = z.infer<typeof assetNamingRuleFormSchema>
