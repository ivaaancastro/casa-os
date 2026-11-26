import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { verifyToken } from './vault/tokens';
import { logAuthEvent } from './auth-events';
import {
  emailRateLimitKey,
  isAuthRateLimited,
  recordAuthFailure,
} from './rate-limit';
import { isLoginRateLimited, verifySecondFactor } from './two-factor';

const INVALID_CREDENTIALS = null;

// Hash bcrypt precomputado para igualar el tiempo de respuesta cuando el usuario
// no existe (evita enumeración por timing).
const DUMMY_PASSWORD_HASH = '$2b$12$xxElxJqhMX58XW8emu7n9ODyqEt6megoQnVLiPJKz/tLT3DZ6Ajxu';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
        totp: { label: 'Código 2FA o de recuperación', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return INVALID_CREDENTIALS;
        }

        const email = credentials.email.trim().toLowerCase();
        const emailLimitKey = emailRateLimitKey(email);
        const totp = credentials.totp?.trim() ?? '';

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password || !user.active) {
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
          if (await isAuthRateLimited(emailLimitKey)) {
            await logAuthEvent({ action: 'RATE_LIMITED' });
            return INVALID_CREDENTIALS;
          }
          await recordAuthFailure(emailLimitKey);
          await logAuthEvent({ action: 'LOGIN_FAILED' });
          return INVALID_CREDENTIALS;
        }

        if (
          (await isLoginRateLimited(user.id)) ||
          (await isAuthRateLimited(emailLimitKey))
        ) {
          await logAuthEvent({ userId: user.id, action: 'RATE_LIMITED' });
          return INVALID_CREDENTIALS;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          await recordAuthFailure(emailLimitKey);
          await logAuthEvent({ userId: user.id, action: 'LOGIN_FAILED' });
          return INVALID_CREDENTIALS;
        }

        if (user.twoFactorEnabled) {
          if (!totp) {
            await recordAuthFailure(emailLimitKey);
            await logAuthEvent({ userId: user.id, action: 'TOTP_FAILED' });
            return INVALID_CREDENTIALS;
          }

          const secondFactor = await verifySecondFactor(user.id, totp);
          if (!secondFactor.valid) {
            await recordAuthFailure(emailLimitKey);
            await logAuthEvent({ userId: user.id, action: 'TOTP_FAILED' });
            return INVALID_CREDENTIALS;
          }

          if (secondFactor.method === 'recovery') {
            await logAuthEvent({ userId: user.id, action: 'RECOVERY_CODE_USED' });
          }
        }

        await logAuthEvent({ userId: user.id, action: 'LOGIN_SUCCESS' });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
    CredentialsProvider({
      id: 'webauthn',
      name: 'WebAuthn',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        const token = credentials?.token;
        if (!token) return null;
        const payload = verifyToken<{ userId: string; exp: number }>(
          token,
          'casa-os:webauthn-login:v1',
        );
        if (!payload || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
        });
        if (!user || !user.active) return null;
        await logAuthEvent({ userId: user.id, action: 'LOGIN_SUCCESS' });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.sessionVersion = user.sessionVersion ?? 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.sessionVersion =
          typeof token.sessionVersion === 'number' ? token.sessionVersion : 0;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};
