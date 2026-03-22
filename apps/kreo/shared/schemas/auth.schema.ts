import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email requis' })
    .email('Email invalide'),
  password: z
    .string({ required_error: 'Mot de passe requis' })
    .min(1, 'Mot de passe requis'),
})

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email requis' })
    .email('Email invalide'),
  password: z
    .string({ required_error: 'Mot de passe requis' })
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/\d/, 'Au moins un chiffre'),
  firstName: z
    .string()
    .min(1, 'Prénom requis')
    .max(50, 'Prénom trop long')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Nom requis')
    .max(50, 'Nom trop long')
    .optional(),
})

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token requis' })
    .min(1, 'Refresh token requis'),
})

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Mot de passe actuel requis' })
    .min(1, 'Mot de passe actuel requis'),
  newPassword: z
    .string({ required_error: 'Nouveau mot de passe requis' })
    .min(8, 'Minimum 8 caractères')
    .regex(/[A-Z]/, 'Au moins une majuscule')
    .regex(/[a-z]/, 'Au moins une minuscule')
    .regex(/\d/, 'Au moins un chiffre'),
})

// Infer types from schemas
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
