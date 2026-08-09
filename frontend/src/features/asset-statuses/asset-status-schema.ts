import { z } from 'zod'

export const assetStatusFormSchema = z.object({
  name: z.string().min(1, 'Укажите название').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  is_default: z.boolean(),
  is_disposal: z.boolean(),
})

export type AssetStatusFormValues = z.infer<typeof assetStatusFormSchema>
