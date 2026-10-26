import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendNotification: vi.fn(),
  setVapidDetails: vi.fn(),
}));

vi.mock('web-push', async (importOriginal) => {
  const actual = await importOriginal<typeof import('web-push')>();
  return {
    ...actual,
    sendNotification: mocks.sendNotification,
    setVapidDetails: mocks.setVapidDetails,
  };
});

import * as webpush from 'web-push';
import {
  MissingPushConfigError,
  describePushError,
  getVapidConfig,
  isExpiredSubscriptionError,
  sendPushNotification,
} from '../src/lib/push';

const subscription = {
  endpoint: 'https://fcm.googleapis.com/wp/abc',
  p256dh: 'BExampleKey',
  auth: 'ExampleAuth',
};

function setVapidEnv() {
  vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'BPublicKey');
  vi.stubEnv('VAPID_PRIVATE_KEY', 'PrivateKey');
  vi.stubEnv('VAPID_SUBJECT', 'mailto:casa@example.com');
}

describe('librería de push', () => {
  beforeEach(() => {
    mocks.sendNotification.mockReset();
    mocks.setVapidDetails.mockReset();
    mocks.sendNotification.mockResolvedValue({
      statusCode: 201,
      body: '',
      headers: {},
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('no devuelve configuración si faltan variables', () => {
    expect(getVapidConfig()).toBeNull();
  });

  it('devuelve la configuración VAPID válida', () => {
    setVapidEnv();
    expect(getVapidConfig()).toEqual({
      publicKey: 'BPublicKey',
      privateKey: 'PrivateKey',
      subject: 'mailto:casa@example.com',
    });
  });

  it('rechaza un subject que no sea mailto o https', () => {
    setVapidEnv();
    vi.stubEnv('VAPID_SUBJECT', 'casa@example.com');
    expect(getVapidConfig()).toBeNull();
  });

  it('envía el payload como JSON con TTL y urgencia', async () => {
    setVapidEnv();
    const payload = { title: 'Recordatorio', body: 'Hoy' };

    await sendPushNotification(subscription, payload);

    expect(mocks.setVapidDetails).toHaveBeenCalledWith(
      'mailto:casa@example.com',
      'BPublicKey',
      'PrivateKey',
    );
    expect(mocks.sendNotification).toHaveBeenCalledWith(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: 'BExampleKey', auth: 'ExampleAuth' },
      },
      JSON.stringify(payload),
      { TTL: 600, urgency: 'high' },
    );
  });

  it('falla con MissingPushConfigError si no hay VAPID', async () => {
    await expect(
      sendPushNotification(subscription, { title: 'x' }),
    ).rejects.toBeInstanceOf(MissingPushConfigError);
    expect(mocks.sendNotification).not.toHaveBeenCalled();
  });

  it('detecta suscripciones expiradas por 404/410', () => {
    expect(
      isExpiredSubscriptionError(
        new webpush.WebPushError('gone', 410, {}, '', subscription.endpoint),
      ),
    ).toBe(true);
    expect(
      isExpiredSubscriptionError(
        new webpush.WebPushError('not found', 404, {}, '', subscription.endpoint),
      ),
    ).toBe(true);
    expect(
      isExpiredSubscriptionError(
        new webpush.WebPushError('server', 500, {}, '', subscription.endpoint),
      ),
    ).toBe(false);
    expect(isExpiredSubscriptionError({ statusCode: 410 })).toBe(true);
  });

  it('describe el error sin filtrar el endpoint', () => {
    const error = new webpush.WebPushError(
      'error',
      410,
      {},
      '',
      subscription.endpoint,
    );

    const description = describePushError(error);
    expect(description).toBe('HTTP 410');
    expect(description).not.toContain(subscription.endpoint);
  });
});
