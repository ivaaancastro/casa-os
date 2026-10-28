/**
 * Constantes compartidas de la bóveda zero-knowledge.
 *
 * Nada de este archivo contiene secretos: son límites y etiquetas que también
 * puede ver el servidor.
 */

export const VAULT_COOKIE = 'casaos_vault';
export const VAULT_GRANT_TTL_SECONDS = 15 * 60;
export const WEBAUTHN_COOKIE = 'casaos_webauthn';
export const WEBAUTHN_CHALLENGE_TTL_SECONDS = 5 * 60;

/** Argon2id: parámetros iniciales. Se guardan por bóveda para poder subirlos. */
export const KDF_OPS_LIMIT = 3;
export const KDF_MEM_LIMIT = 64 * 1024 * 1024; // 64 MiB
export const KDF_ALGORITHM = 'argon2id13';
export const KDF_SALT_BYTES = 16;

export const KEY_BYTES = 32;
export const NONCE_BYTES = 24;

/** Límites de tamaño aceptados por la API (ciphertext en base64). */
export const MAX_CIPHERTEXT_BASE64 = 96 * 1024;
export const MAX_WRAPPED_KEY_BASE64 = 1024;
export const MAX_KEYS_PER_ACCOUNT = 50;

/** Rate limits de la bóveda. */
export const UNLOCK_MAX_FAILURES = 5;
export const UNLOCK_WINDOW_MS = 15 * 60_000;
export const RECOVERY_MAX_ATTEMPTS = 3;
export const RECOVERY_WINDOW_MS = 60 * 60_000;

export const VISIBILITIES = ['PRIVATE', 'FAMILY', 'CUSTOM'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  PRIVATE: 'Solo yo',
  FAMILY: 'Toda la familia',
  CUSTOM: 'Personas concretas',
};

export const AUTO_LOCK_OPTIONS = [1, 2, 5, 10, 15] as const;
export const DEFAULT_AUTO_LOCK_MINUTES = 5;

export const MASTER_PASSWORD_MIN_LENGTH = 12;

export const ACCOUNT_CATEGORIES = [
  'Correo',
  'Google',
  'Redes',
  'Compras',
  'Hogar',
  'Entretenimiento',
  'Trabajo',
  'Otros',
] as const;
