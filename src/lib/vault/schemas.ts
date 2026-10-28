import { z } from 'zod';
import {
  MAX_CIPHERTEXT_BASE64,
  MAX_KEYS_PER_ACCOUNT,
  MAX_WRAPPED_KEY_BASE64,
  VISIBILITIES,
} from './constants';

const BASE64_REGEX = /^[A-Za-z0-9+/]+={0,2}$/;

const b64 = (max: number, label: string) =>
  z
    .string()
    .min(1, `${label} es obligatorio`)
    .max(max, `${label} es demasiado largo`)
    .regex(BASE64_REGEX, `${label} no es base64 válido`);

const salt = b64(128, 'La sal');
const key = b64(256, 'La clave');
const publicKey = b64(256, 'La clave pública');
const nonce = b64(128, 'El nonce');
const wrappedKeyring = b64(16 * 1024, 'El keyring');
const wrappedDek = b64(MAX_WRAPPED_KEY_BASE64, 'La clave de la cuenta');
const ciphertext = b64(MAX_CIPHERTEXT_BASE64, 'El contenido');

const kdfOpsLimit = z.number().int().min(1).max(10);
const kdfMemLimit = z
  .number()
  .int()
  .min(16 * 1024 * 1024)
  .max(512 * 1024 * 1024);

export const visibilitySchema = z.enum(VISIBILITIES, {
  errorMap: () => ({ message: 'La visibilidad no es válida' }),
});

export const recoveryBlobSchema = z.object({
  kdfSalt: salt,
  kdfOpsLimit,
  kdfMemLimit,
  wrappedKeyring,
  nonce,
});

export const createVaultSchema = z.object({
  kdfSalt: salt,
  kdfOpsLimit,
  kdfMemLimit,
  authKey: key,
  publicKey,
  wrappedKeyring,
  keyringNonce: nonce,
  recovery: recoveryBlobSchema,
});

export const unlockSchema = z.object({
  authKey: key,
  code: z.string().trim().min(6).max(64),
});

export const updateKeyringSchema = z.object({
  kdfSalt: salt,
  kdfOpsLimit,
  kdfMemLimit,
  authKey: key,
  wrappedKeyring,
  keyringNonce: nonce,
});

export const updateRecoverySchema = recoveryBlobSchema.extend({
  contactShares: z
    .array(
      z.object({
        contactId: z.string().min(1).max(64),
        wrappedRecoveryKey: b64(16 * 1024, 'La copia de recuperación'),
      }),
    )
    .max(20)
    .optional(),
});

export const resetRecoverySchema = updateKeyringSchema.extend({
  code: z.string().trim().min(6).max(64),
  recovery: recoveryBlobSchema,
});

const accountKeySchema = z.object({
  userId: z.string().min(1).max(64),
  wrappedDek,
  canEdit: z.boolean().default(false),
});

const accountKeysArray = z
  .array(accountKeySchema)
  .min(1)
  .max(MAX_KEYS_PER_ACCOUNT)
  .refine(
    (keys) => new Set(keys.map((k) => k.userId)).size === keys.length,
    'Hay destinatarios duplicados',
  );

export const createAccountSchema = z.object({
  visibility: visibilitySchema,
  ciphertext,
  nonce,
  keys: accountKeysArray,
});

export const updateAccountSchema = z.object({
  ciphertext,
  nonce,
  revision: z.number().int().min(1),
});

export const updateAccountKeysSchema = z.object({
  visibility: visibilitySchema,
  ciphertext,
  nonce,
  revision: z.number().int().min(1),
  keys: accountKeysArray,
});

export const createTrustedContactSchema = z.object({
  contactId: z.string().min(1).max(64),
  wrappedRecoveryKey: b64(16 * 1024, 'La copia de recuperación'),
});

const webauthnResponseSchema = z
  .record(z.unknown())
  .refine((value) => typeof value.id === 'string' && typeof value.rawId === 'string', {
    message: 'Respuesta WebAuthn no válida',
  });

export const passkeyRegisterSchema = z.object({
  response: webauthnResponseSchema,
  prfSalt: salt,
  wrappedKeyring,
  keyringNonce: nonce,
});

export const passkeyUnlockSchema = z.object({
  response: webauthnResponseSchema,
  code: z.string().trim().min(6).max(64),
});

export const codeSchema = z.object({
  code: z.string().trim().min(6).max(64),
});

export const deleteVaultSchema = z.object({
  authKey: key,
  code: z.string().trim().min(6).max(64),
  confirm: z.literal('BORRAR'),
});

export const passkeyOptionsSchema = z.object({
  passkeyId: z.string().min(1).max(128).optional(),
});

export type CreateVaultInput = z.infer<typeof createVaultSchema>;
export type UnlockInput = z.infer<typeof unlockSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type UpdateAccountKeysInput = z.infer<typeof updateAccountKeysSchema>;
