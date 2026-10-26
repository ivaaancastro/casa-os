import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import {
  MissingPushConfigError,
  describePushError,
  getPushErrorStatus,
  isExpiredSubscriptionError,
  sendPushNotification,
  type PushSubscriptionRecord,
} from './push';
import { MAX_DELIVERY_ATTEMPTS } from './reminders';

export interface PushSubscriptionForSend extends PushSubscriptionRecord {
  id: string;
  failureCount: number;
}

export interface SendOutcome {
  sent: boolean;
  deactivated: boolean;
  error?: string;
}

export type ReminderDeliveryStatus = 'SENT' | 'FAILED' | 'SKIPPED';

export interface ReminderDeliveryOutcome {
  status: ReminderDeliveryStatus;
  deactivated: boolean;
}

function nextFailureCount(subscription: PushSubscriptionForSend): number {
  return subscription.failureCount + 1;
}

/** Envía un push y actualiza el estado de la suscripción. */
export async function sendAndRecordSubscription(
  subscription: PushSubscriptionForSend,
  payload: unknown,
): Promise<SendOutcome> {
  try {
    await sendPushNotification(subscription, payload);
  } catch (error) {
    if (error instanceof MissingPushConfigError) throw error;

    const expired = isExpiredSubscriptionError(error);
    const failures = expired ? 5 : nextFailureCount(subscription);
    const deactivated = expired || failures >= 5;

    try {
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: {
          active: !deactivated,
          failureCount: failures,
          lastFailureAt: new Date(),
        },
      });
    } catch {
      // El envío ya falló; no ocultamos el fallo original por un problema de BD.
    }

    return {
      sent: false,
      deactivated,
      error: describePushError(error),
    };
  }

  try {
    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: {
        active: true,
        failureCount: 0,
        lastSuccessAt: new Date(),
      },
    });
  } catch {
    // El push ya se envió; un fallo al registrar el éxito no debe duplicarlo.
  }

  return { sent: true, deactivated: false };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * Envía un recordatorio y registra la entrega.
 *
 * La clave única `[eventId, subscriptionId, scheduledFor]` evita duplicados.
 * Si una entrega anterior falló y aún quedan intentos, se reintenta.
 */
export async function deliverReminder(
  eventId: string,
  subscription: PushSubscriptionForSend,
  scheduledFor: Date,
  payload: unknown,
): Promise<ReminderDeliveryOutcome> {
  const where = {
    eventId_subscriptionId_scheduledFor: {
      eventId,
      subscriptionId: subscription.id,
      scheduledFor,
    },
  };

  const existing = await prisma.reminderDelivery.findUnique({
    where,
    select: { id: true, status: true, attempts: true },
  });

  if (existing?.status === 'SENT') {
    return { status: 'SKIPPED', deactivated: false };
  }

  if (existing && existing.attempts >= MAX_DELIVERY_ATTEMPTS) {
    return { status: 'SKIPPED', deactivated: false };
  }

  let deliveryId: string;

  try {
    if (existing) {
      const updated = await prisma.reminderDelivery.update({
        where: { id: existing.id },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
          error: null,
        },
        select: { id: true },
      });
      deliveryId = updated.id;
    } else {
      const created = await prisma.reminderDelivery.create({
        data: {
          eventId,
          subscriptionId: subscription.id,
          scheduledFor,
          status: 'FAILED',
          attempts: 1,
        },
        select: { id: true },
      });
      deliveryId = created.id;
    }
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    // Otra ejecución creó la entrega al mismo tiempo. No duplicamos el envío:
    // el siguiente ciclo podrá reintentar si sigue dentro de la ventana.
    return { status: 'SKIPPED', deactivated: false };
  }

  const result = await sendAndRecordSubscription(subscription, payload);

  await prisma.reminderDelivery.update({
    where: { id: deliveryId },
    data: result.sent
      ? { status: 'SENT', error: null }
      : { status: 'FAILED', error: result.error ?? 'Error de envío' },
  });

  return {
    status: result.sent ? 'SENT' : 'FAILED',
    deactivated: result.deactivated,
  };
}

export function pushErrorStatus(error: unknown): number | null {
  return getPushErrorStatus(error);
}
