import { describe, it, expect } from 'vitest';
import {
  pushSubscriptionIdSchema,
  pushSubscriptionSchema,
  upcomingRemindersQuerySchema,
} from '../../src/lib/schemas/push';

const validSubscription = {
  endpoint: 'https://fcm.googleapis.com/wp/abc',
  expirationTime: null,
  keys: {
    p256dh: 'BExampleKey',
    auth: 'ExampleAuth',
  },
};

describe('esquemas de push', () => {
  it('acepta una suscripción válida', () => {
    const parsed = pushSubscriptionSchema.parse(validSubscription);
    expect(parsed.endpoint).toBe(validSubscription.endpoint);
    expect(parsed.keys.p256dh).toBe('BExampleKey');
  });

  it('exige HTTPS y una URL válida', () => {
    expect(() =>
      pushSubscriptionSchema.parse({
        ...validSubscription,
        endpoint: 'http://example.com/push',
      }),
    ).toThrow();

    expect(() =>
      pushSubscriptionSchema.parse({
        ...validSubscription,
        endpoint: 'no-es-una-url',
      }),
    ).toThrow();
  });

  it('limita la longitud del endpoint y las claves', () => {
    expect(() =>
      pushSubscriptionSchema.parse({
        ...validSubscription,
        endpoint: `https://example.com/${'a'.repeat(1024)}`,
      }),
    ).toThrow();

    expect(() =>
      pushSubscriptionSchema.parse({
        ...validSubscription,
        keys: { p256dh: '', auth: 'ExampleAuth' },
      }),
    ).toThrow();
  });

  it('aplica el límite por defecto y valida el rango', () => {
    expect(upcomingRemindersQuerySchema.parse({})).toEqual({ limit: 5 });
    expect(upcomingRemindersQuerySchema.parse({ limit: '1' })).toEqual({
      limit: 1,
    });
    expect(upcomingRemindersQuerySchema.parse({ limit: '10' })).toEqual({
      limit: 10,
    });
    expect(() => upcomingRemindersQuerySchema.parse({ limit: '0' })).toThrow();
    expect(() => upcomingRemindersQuerySchema.parse({ limit: '11' })).toThrow();
    expect(() =>
      upcomingRemindersQuerySchema.parse({ limit: '2.5' }),
    ).toThrow();
  });

  it('valida el id de la suscripción', () => {
    expect(pushSubscriptionIdSchema.parse('sub_1')).toBe('sub_1');
    expect(() => pushSubscriptionIdSchema.parse('')).toThrow();
  });
});
