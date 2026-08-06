import { z } from 'zod'

export const settingsFormSchema = z.object({
  default_responsible_person: z.string().max(200).optional().or(z.literal('')),
  default_asset_type_id: z.number().int().positive().optional(),
  default_bulk_asset_template: z.string().max(300).optional().or(z.literal('')),
  default_bulk_asset_separator: z.string().max(10).optional().or(z.literal('')),
  default_bulk_event_separator: z.string().max(10).optional().or(z.literal('')),
  default_export_template: z.string().max(300).optional().or(z.literal('')),
  default_export_separator: z.string().max(10).optional().or(z.literal('')),
})

export type SettingsFormValues = z.infer<typeof settingsFormSchema>
