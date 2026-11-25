import { resetVaultState } from './helpers/vault-setup';

/**
 * Deja la BD local en un estado conocido antes de toda la suite E2E:
 * el usuario de prueba sin 2FA y sin contraseñas. Así los tests de navegación de
 * Fase 1 siguen funcionando aunque un run anterior de Cuentas haya activado 2FA.
 */
export default async function globalSetup(): Promise<void> {
  await resetVaultState();
}
