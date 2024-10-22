/* eslint-disable no-undef */
import prismadb from '../../../../../libs/prismadb';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';

export const authOptions = {
  adapter: PrismaAdapter(prismadb),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialProvider({
      name: 'credentials',
      credentials: {
        phone: {
          label: 'phone',
          type: 'text',
        },
      },
      async authorize(credentials) {
        if (!credentials?.phone) return null;

        const user = await Prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) return null;

        return user;
      },
    }),
  ],
  callbacks: {
    session: ({ session, token }) => {
      return { ...session,
      user: {
        ...session.user,
        userId : token.userId,
        userRole : token.userRole
      }
    }
    },
    jwt: ({ token, user }) => {
      if (user) return {
        ...token,
        userId : user.id,
        userRole : user.role
      }
    },
  },
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signUp: '/signup'
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };