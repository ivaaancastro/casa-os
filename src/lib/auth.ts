import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { logAuthEvent } from './auth-events';
import {
  emailRateLimitKey,
  isAuthRateLimited,
  recordAuthFailure,
} from './rate-limit';
import { isLoginRateLimited, verifySecondFactor } from './two-factor';

const INVALID_CREDENTIALS = null;

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
          if (isAuthRateLimited(emailLimitKey)) {
            await logAuthEvent({ action: 'RATE_LIMITED' });
            return INVALID_CREDENTIALS;
          }
          recordAuthFailure(emailLimitKey);
          await logAuthEvent({ action: 'LOGIN_FAILED' });
          return INVALID_CREDENTIALS;
        }

        if (
          (await isLoginRateLimited(user.id)) ||
          isAuthRateLimited(emailLimitKey)
        ) {
          await logAuthEvent({ userId: user.id, action: 'RATE_LIMITED' });
          return INVALID_CREDENTIALS;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          recordAuthFailure(emailLimitKey);
          await logAuthEvent({ userId: user.id, action: 'LOGIN_FAILED' });
          return INVALID_CREDENTIALS;
        }

        if (user.twoFactorEnabled) {
          if (!totp) {
            recordAuthFailure(emailLimitKey);
            await logAuthEvent({ userId: user.id, action: 'TOTP_FAILED' });
            return INVALID_CREDENTIALS;
          }

          const secondFactor = await verifySecondFactor(user.id, totp);
          if (!secondFactor.valid) {
            recordAuthFailure(emailLimitKey);
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
