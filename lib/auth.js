import crypto from 'crypto';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Generates a secure random token for email verification
 * @returns {string} The generated token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculates token expiration date
 * @param {number} hours Number of hours until token expires
 * @returns {Date} Expiration date
 */
export function getTokenExpiration(hours = 24) {
  const now = new Date();
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Validates if a token is expired
 * @param {Date} expiryDate The token expiration date
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(expiryDate) {
  return new Date() > new Date(expiryDate);
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Correo Electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Por favor, ingrese email y contraseña');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error('Contraseña incorrecta');
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Correo electrónico no verificado. Por favor, verifica tu correo para continuar.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountTier: user.accountTier,
          emailVerified: user.emailVerified,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.accountTier = user.accountTier;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        // Fetch fresh user data from database
        const user = await prisma.user.findUnique({
          where: { id: token.id },
          select: {
            role: true,
            id: true,
            name: true,
            email: true,
            accountTier: true,
            emailVerified: true
          }
        });

        if (user) {
          session.user = {
            ...session.user,
            ...user
          };
        } else {
          // Fallback to token data if user not found
          session.user.role = token.role;
          session.user.id = token.id;
          session.user.name = token.name;
          session.user.email = token.email;
          session.user.accountTier = token.accountTier;
          session.user.emailVerified = token.emailVerified;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
}; 