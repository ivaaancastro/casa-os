import { beforeEach, describe, it, expect, vi } from 'vitest';
import * as webpush from 'web-push';

const prismaMock = vi.hoisted(() => ({
  pushSubscription: {
    update: vi.fn(),
  },
  reminderDelivery: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

const pushMocks = vi.hoisted(() => ({
  sendPushNotification: vi.fn(),
}));

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }));

vi.mock('../src/lib/push', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/push')>();
  return {
    ...actual,
    sendPushNotification: pushMocks.sendPushNotification,
  };
});

import {
  deliverReminder,
  sendAndRecordSubscription,
  type PushSubscriptionForSend,
} from '../src/lib/push-service';

const subscription: PushSubscriptionForSend = {
  id: 'sub_1',
  endpoint: 'https://fcm.googleapis.com/wp/abc',
  p256dh: 'BExampleKey',
  auth: 'ExampleAuth',
  failureCount: 0,
};

const scheduledFor = new Date('2026-10-26T19:00:00.000Z');

describe('servicio de push', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pushMocks.sendPushNotification.mockResolvedValue({
      statusCode: 201,
      body: '',
      headers: {},
    });
    prismaMock.reminderDelivery.findUnique.mockResolvedValue(null);
    prismaMock.reminderDelivery.create.mockResolvedValue({ id: 'del_1' });
    prismaMock.reminderDelivery.update.mockResolvedValue({});
    prismaMock.pushSubscription.update.mockResolvedValue({});
  });

  it('marca el éxito y resetea los fallos', async () => {
    const outcome = await sendAndRecordSubscription(subscription, {
      title: 'Recordatorio',
    });

    expect(outcome).toEqual({ sent: true, deactivated: false });
    expect(prismaMock.pushSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub_1' },
      data: expect.objectContaining({
        active: true,
        failureCount: 0,
      }),
    });
  });

  it('incrementa fallos y desactiva una suscripción expirada', async () => {
    pushMocks.sendPushNotification.mockRejectedValueOnce(
      new webpush.WebPushError(
        'gone',
        410,
        {},
        '',
        subscription.endpoint,
      ),
    );

    const outcome = await sendAndRecordSubscription(subscription, {
      title: 'Recordatorio',
    });

    expect(outcome).toEqual({
      sent: false,
      deactivated: true,
      error: 'HTTP 410',
    });
    expect(prismaMock.pushSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub_1' },
      data: expect.objectContaining({
        active: false,
        failureCount: 5,
      }),
    });
  });

  it('desactiva tras cinco fallos consecutivos', async () => {
    pushMocks.sendPushNotification.mockRejectedValueOnce(
      new webpush.WebPushError(
        'server',
        500,
        {},
        '',
        subscription.endpoint,
      ),
    );

    const outcome = await sendAndRecordSubscription(
      { ...subscription, failureCount: 4 },
      { title: 'Recordatorio' },
    );

    expect(outcome.deactivated).toBe(true);
    expect(prismaMock.pushSubscription.update).toHaveBeenCalledWith({
      where: { id: 'sub_1' },
      data: expect.objectContaining({ active: false }),
    });
  });

  it('crea la entrega, envía y la marca como SENT', async () => {
    const outcome = await deliverReminder(
      'evt_1',
      subscription,
      scheduledFor,
      { title: 'Recordatorio' },
    );

    expect(outcome).toEqual({ status: 'SENT', deactivated: false });
    expect(prismaMock.reminderDelivery.create).toHaveBeenCalledWith({
      data: {
        eventId: 'evt_1',
        subscriptionId: 'sub_1',
        scheduledFor,
        status: 'FAILED',
        attempts: 1,
      },
      select: { id: true },
    });
    expect(pushMocks.sendPushNotification).toHaveBeenCalledTimes(1);
    expect(prismaMock.reminderDelivery.update).toHaveBeenCalledWith({
      where: { id: 'del_1' },
      data: { status: 'SENT', error: null },
    });
  });

  it('no repite una entrega ya enviada', async () => {
    prismaMock.reminderDelivery.findUnique.mockResolvedValueOnce({
      id: 'del_1',
      status: 'SENT',
      attempts: 1,
    });

    const outcome = await deliverReminder(
      'evt_1',
      subscription,
      scheduledFor,
      { title: 'Recordatorio' },
    );

    expect(outcome).toEqual({ status: 'SKIPPED', deactivated: false });
    expect(pushMocks.sendPushNotification).not.toHaveBeenCalled();
    expect(prismaMock.reminderDelivery.update).not.toHaveBeenCalled();
  });

  it('no reintenta una entrega agotada', async () => {
    prismaMock.reminderDelivery.findUnique.mockResolvedValueOnce({
      id: 'del_1',
      status: 'FAILED',
      attempts: 3,
    });

    const outcome = await deliverReminder(
      'evt_1',
      subscription,
      scheduledFor,
      { title: 'Recordatorio' },
    );

    expect(outcome).toEqual({ status: 'SKIPPED', deactivated: false });
    expect(pushMocks.sendPushNotification).not.toHaveBeenCalled();
  });

  it('reintenta una entrega fallida y guarda el error', async () => {
    prismaMock.reminderDelivery.findUnique.mockResolvedValueOnce({
      id: 'del_1',
      status: 'FAILED',
      attempts: 1,
    });
    prismaMock.reminderDelivery.update.mockResolvedValueOnce({ id: 'del_1' });
    pushMocks.sendPushNotification.mockRejectedValueOnce(
      new webpush.WebPushError(
        'server',
        500,
        {},
        '',
        subscription.endpoint,
      ),
    );

    const outcome = await deliverReminder(
      'evt_1',
      subscription,
      scheduledFor,
      { title: 'Recordatorio' },
    );

    expect(outcome.status).toBe('FAILED');
    expect(prismaMock.reminderDelivery.update).toHaveBeenCalledWith({
      where: { id: 'del_1' },
      data: { status: 'FAILED', error: 'HTTP 500' },
    });
  });
});
