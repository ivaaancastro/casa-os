import { z } from 'zod';
import { isRecoveryCodeFormat } from '../two-factor-recovery';

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'El codigo debe tener 6 digitos');

export const recoveryCodeSchema = z
  .string()
  .trim()
  .min(1, 'El codigo de recuperacion es obligatorio')
  .max(40, 'El codigo de recuperacion no es valido')
  .refine(isRecoveryCodeFormat, 'El codigo de recuperacion no es valido');

const passwordSchema = z
  .string()
  .min(1, 'La contrasena es obligatoria')
  .max(200, 'La contrasena es demasiado larga');

export const enableTwoFactorSchema = z.object({
  code: totpCodeSchema,
});

export const disableTwoFactorSchema = z
  .object({
    password: passwordSchema,
    code: totpCodeSchema.optional(),
    recoveryCode: recoveryCodeSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.code && !data.recoveryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: 'Introduce un codigo 2FA o un codigo de recuperacion',
      });
    }
    if (data.code && data.recoveryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['code'],
        message: 'Usa solo un codigo a la vez',
      });
    }
  });

export const regenerateRecoveryCodesSchema = z.object({
  password: passwordSchema,
  code: totpCodeSchema,
});

export const adminResetTwoFactorSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar la operacion' }),
  }),
});

export type EnableTwoFactorInput = z.infer<typeof enableTwoFactorSchema>;
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;
export type RegenerateRecoveryCodesInput = z.infer<
  typeof regenerateRecoveryCodesSchema
>;
export type AdminResetTwoFactorInput = z.infer<
  typeof adminResetTwoFactorSchema
>;
