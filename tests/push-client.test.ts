import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from '../src/lib/utils/push-client';

describe('cliente de push', () => {
  it('convierte base64url a binario', () => {
    expect(Array.from(urlBase64ToUint8Array('SGVsbG8'))).toEqual([
      72, 101, 108, 108, 111,
    ]);
  });

  it('acepta base64url con - y _', () => {
    const bytes = urlBase64ToUint8Array('AP_-');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(3);
  });
});
