import { z } from 'zod';

export const USER_ROLES = ['ADMIN', 'FAMILY'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const PASSWORD_MIN = 8;
export const USER_NAME_MAX = 80;

const nameField = z
  .string()
  .trim()
  .min(1, 'El nombre es obligatorio')
  .max(USER_NAME_MAX, `El nombre no puede superar ${USER_NAME_MAX} caracteres`);

const passwordField = z
  .string()
  .min(PASSWORD_MIN, `La contrasena debe tener al menos ${PASSWORD_MIN} caracteres`)
  .max(200, 'La contrasena es demasiado larga');

export const createUserSchema = z.object({
  name: nameField,
  email: z.string().trim().toLowerCase().email('Email no valido'),
  role: z.enum(USER_ROLES, {
    errorMap: () => ({ message: 'El rol debe ser ADMIN o FAMILY' }),
  }),
  password: passwordField,
});

export const updateUserSchema = z
  .object({
    name: nameField.optional(),
    role: z.enum(USER_ROLES).optional(),
    active: z.boolean().optional(),
    password: passwordField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'No hay cambios que aplicar',
  });

export const updateProfileSchema = z.object({
  name: nameField,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contrasena actual es obligatoria'),
  newPassword: passwordField,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
