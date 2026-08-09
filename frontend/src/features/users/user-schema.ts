import { z } from 'zod'

export const userFormSchema = z.object({
  username: z.string().min(1, 'Укажите имя пользователя').max(100),
  first_name: z.string().min(1, 'Укажите имя').max(100),
  last_name: z.string().min(1, 'Укажите фамилию').max(100),
  password: z.string().max(200).optional(),
  is_admin: z.boolean(),
})

export type UserFormValues = z.infer<typeof userFormSchema>

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Минимум 8 символов').max(200),
})

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
