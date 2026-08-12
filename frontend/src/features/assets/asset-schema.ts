import { z } from 'zod'

export const customFieldValueFormSchema = z.object({
  definition_id: z.number(),
  // Optional: a field the user hasn't touched yet (e.g. added after the asset was
  // created, or the reseed effect in AssetFormDialog hasn't settled by the time the
  // form first renders) is "not filled in", not an invalid value — required-ness
  // is enforced separately in AssetFormDialog's onSubmit, not by this schema.
  value: z.union([z.string(), z.boolean()]).optional(),
})

export const assetFormSchema = z.object({
  asset_type_id: z.number({ error: 'Выберите тип актива' }).int().positive(),
  name: z.string().max(200).optional().or(z.literal('')),
  inventory_number: z
    .string()
    .regex(/^\d*$/, 'Только цифры')
    .max(15)
    .optional()
    .or(z.literal('')),
  serial_number: z.string().max(100).optional().or(z.literal('')),
  place_id: z.number().int().positive().optional(),
  notes: z.string().optional().or(z.literal('')),
  custom_field_values: z.array(customFieldValueFormSchema),
})

export type AssetFormValues = z.infer<typeof assetFormSchema>
