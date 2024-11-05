/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';

export const authOptions = {
  adapter: PrismaAdapter(prismadb),
  secret: process.env.NEXTAUTH_SECRET,
  encryption: false,
  providers: [
    CredentialProvider({
      name: 'credentials',
      credentials: {
        phone: {
          label: 'Phone Number',
          type: 'text',
        },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          throw new Error('شماره تلفن ضروری است.');
        }

        const user = await prismadb.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          throw new Error('کاربری با این شماره تلفن پیدا نشد.');
        }

        return user;
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      session.user = {
        ...session.user,
        userId: token.userId,
        userRole: token.userRole,
      };
      return session;
    },
    jwt: ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.userRole = user.role;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    signUp: '/signup',
    confirmCode: '/confirm-code',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
