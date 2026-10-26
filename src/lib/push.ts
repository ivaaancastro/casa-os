import * as webpush from 'web-push';

export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export class MissingPushConfigError extends Error {
  constructor() {
    super('Faltan las claves VAPID en el servidor');
    this.name = 'MissingPushConfigError';
  }
}

/**
 * Devuelve la configuración VAPID o `null` si falta algún valor.
 *
 * No se valida en el arranque: así `next build` puede ejecutarse sin secretos y
 * el error se muestra solo cuando se intenta enviar o configurar un dispositivo.
 */
export function getVapidConfig(): VapidConfig | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) return null;

  if (!subject.startsWith('mailto:') && !subject.startsWith('https://')) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

export function hasPushConfig(): boolean {
  return getVapidConfig() !== null;
}

/**
 * Envía un payload JSON a una suscripción concreta.
 *
 * `TTL` limita la vida del mensaje si el dispositivo está desconectado. No se
 * incluye `topic`: la deduplicación lógica vive en `ReminderDelivery`.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: unknown,
): Promise<webpush.SendResult> {
  const config = getVapidConfig();
  if (!config) throw new MissingPushConfigError();

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);

  return webpush.sendNotification(
    {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    },
    JSON.stringify(payload),
    {
      TTL: 600,
      urgency: 'high',
    },
  );
}

/** `true` si el proveedor indica que la suscripción ya no existe. */
export function isExpiredSubscriptionError(error: unknown): boolean {
  const statusCode = getPushErrorStatus(error);
  return statusCode === 404 || statusCode === 410;
}

export function getPushErrorStatus(error: unknown): number | null {
  if (error instanceof webpush.WebPushError) return error.statusCode;

  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  ) {
    return (error as { statusCode: number }).statusCode;
  }

  return null;
}

/**
 * Texto seguro para guardar en `ReminderDelivery.error`.
 *
 * No incluye endpoints, títulos ni el cuerpo del error del proveedor: solo el
 * estado HTTP o el nombre/código del error de red.
 */
export function describePushError(error: unknown): string {
  const statusCode = getPushErrorStatus(error);
  if (statusCode !== null) return `HTTP ${statusCode}`;

  if (error instanceof Error) {
    const code =
      'code' in error && typeof (error as { code?: unknown }).code === 'string'
        ? ` ${(error as { code: string }).code}`
        : '';
    return `${error.name}${code}`.slice(0, 500);
  }

  return 'Error desconocido';
}
