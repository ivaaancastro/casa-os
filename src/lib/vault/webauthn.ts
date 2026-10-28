import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import { WEBAUTHN_CHALLENGE_TTL_SECONDS, WEBAUTHN_COOKIE } from './constants';
import { signToken, verifyToken } from './tokens';

const PURPOSE = 'casa-os:webauthn:v1';

export interface WebAuthnConfig {
  rpID: string;
  origin: string;
  rpName: string;
}

export function getWebAuthnConfig(): WebAuthnConfig {
  const configuredOrigin = process.env.WEBAUTHN_ORIGIN;
  const base = configuredOrigin ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  let origin: string;
  try {
    origin = new URL(base).origin;
  } catch {
    origin = 'http://localhost:3000';
  }
  const rpID = process.env.WEBAUTHN_RP_ID ?? new URL(origin).hostname;
  return { rpID, origin, rpName: 'casa-os' };
}

export interface ChallengePayload {
  challenge: string;
  sub: string;
  type: 'registration' | 'authentication';
  prfSalt?: string;
  exp: number;
}

export function newPrfSalt(): string {
  return randomBytes(32).toString('base64');
}

export function parseTransports(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

export function setChallengeCookie(
  response: NextResponse,
  payload: Omit<ChallengePayload, 'exp'>,
): void {
  const token = signToken(
    {
      ...payload,
      exp: Date.now() + WEBAUTHN_CHALLENGE_TTL_SECONDS * 1000,
    },
    PURPOSE,
  );
  response.cookies.set(WEBAUTHN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/cuentas',
    maxAge: WEBAUTHN_CHALLENGE_TTL_SECONDS,
  });
}

export function readChallenge(
  request: NextRequest,
  userId: string,
  type: ChallengePayload['type'],
): ChallengePayload | null {
  const token = request.cookies.get(WEBAUTHN_COOKIE)?.value;
  const payload = verifyToken<ChallengePayload>(token, PURPOSE);
  if (!payload) return null;
  if (payload.sub !== userId || payload.type !== type) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= Date.now()) return null;
  if (typeof payload.challenge !== 'string') return null;
  return payload;
}

export function clearChallengeCookie(response: NextResponse): void {
  response.cookies.set(WEBAUTHN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/cuentas',
    maxAge: 0,
  });
}

export async function registrationOptions(input: {
  userId: string;
  email: string;
  name: string | null;
  existingCredentialIds: string[];
}) {
  const { rpID, rpName } = getWebAuthnConfig();
  return generateRegistrationOptions({
    rpName,
    rpID,
    userID: Buffer.from(input.userId, 'utf8'),
    userName: input.email,
    userDisplayName: input.name ?? input.email,
    attestationType: 'none',
    timeout: 60_000,
    excludeCredentials: input.existingCredentialIds.map((id) => ({ id })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'required',
    },
    extensions: {
      // El cliente completa `eval.first` con el salt real antes de llamar a
      // navigator.credentials.create(); aquí solo se declara la extensión.
      prf: {},
    },
  });
}

export async function verifyRegistration(
  response: RegistrationResponseJSON,
  expectedChallenge: string,
): Promise<WebAuthnCredential> {
  const { rpID, origin } = getWebAuthnConfig();
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified) throw new Error('Registro WebAuthn no verificado');
  return verification.registrationInfo.credential;
}

export async function authenticationOptions(input: {
  credentials: Array<{ credentialId: string; transports: string[] }>;
}) {
  const { rpID } = getWebAuthnConfig();
  return generateAuthenticationOptions({
    rpID,
    timeout: 60_000,
    allowCredentials: input.credentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports,
    })),
    userVerification: 'required',
  });
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON,
  expectedChallenge: string,
  credential: WebAuthnCredential,
): Promise<number> {
  const { rpID, origin } = getWebAuthnConfig();
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential,
    requireUserVerification: true,
  });

  if (!verification.verified) throw new Error('Autenticación WebAuthn no verificada');
  return verification.authenticationInfo.newCounter;
}
