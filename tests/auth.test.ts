import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';

describe('bcrypt password verification', () => {
  it('should hash and verify a password correctly', async () => {
    const password = 'miContraseña123';
    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toBe(password);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare('wrong-password', hash)).toBe(false);
  });

  it('should generate different hashes for the same password', async () => {
    const password = 'same-password';
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);

    expect(hash1).not.toBe(hash2);
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });

  it('should fail verification with wrong password', async () => {
    const hash = await bcrypt.hash('correct-password', 12);
    expect(await bcrypt.compare('incorrect-password', hash)).toBe(false);
  });
});
