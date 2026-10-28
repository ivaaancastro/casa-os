import type { RecoveryKit } from '@/lib/vault/types';

export function buildRecoveryKit(input: {
  email: string;
  recoveryKey: string;
  createdAt?: string;
}): RecoveryKit {
  return {
    version: 1,
    email: input.email,
    createdAt: input.createdAt ?? new Date().toISOString(),
    recoveryKey: input.recoveryKey,
    instructions:
      'Guarda este archivo en un lugar seguro y sin conexión. Casa-os no conserva una copia del código. Sin este kit ni un contacto de confianza, perder la master password hace la bóveda irrecuperable.',
  };
}

export function kitText(kit: RecoveryKit): string {
  return [
    'casa-os — Kit de recuperación de la bóveda',
    `Cuenta: ${kit.email}`,
    `Creado: ${kit.createdAt}`,
    `Versión: ${kit.version}`,
    '',
    'Código de recuperación:',
    kit.recoveryKey,
    '',
    kit.instructions,
    '',
  ].join('\n');
}

export function downloadRecoveryKit(kit: RecoveryKit): void {
  const blob = new Blob([kitText(kit)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'casa-os-recuperacion.txt';
  link.click();
  URL.revokeObjectURL(url);
}
