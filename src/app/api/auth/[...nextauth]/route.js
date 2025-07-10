/* eslint-disable no-undef */
import prismadb from '@/libs/prismadb';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth from 'next-auth';
import CredentialProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  adapter: PrismaAdapter(prismadb),
  secret: process.env.NEXTAUTH_SECRET,
  encryption: false,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
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
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await prismadb.user.findUnique({
          where: { email: user.email },
        });

        // اگر کاربر جدید باشه، باید کاربر رو بسازیم
        if (!existingUser) {
          const firstname = user.given_name || 'user';
          const randomDigits = Math.floor(1000 + Math.random() * 9000);
          const generatedUsername = `${firstname}_${randomDigits}`;

          // ذخیره‌سازی کاربر جدید با تمام اطلاعات دریافتی از گوگل
          await prismadb.user.create({
            data: {
              email: user.email,
              username: generatedUsername,
              firstName: user.given_name, // نام کوچک
              lastName: user.family_name, // نام خانوادگی
              avatar: user.picture, // عکس پروفایل
              role: 'user', // می‌تونی مقدار پیش‌فرض role رو تغییر بدی
            },
          });
        } else {
          // اگر کاربر موجود باشه و `username` نداشته باشه، یک `username` جدید بسازیم
          if (!existingUser.username) {
            const firstname = user.given_name || 'user';
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const generatedUsername = `${firstname}_${randomDigits}`;

            // آپدیت کردن `username` برای کاربر موجود
            await prismadb.user.update({
              where: { id: existingUser.id },
              data: { username: generatedUsername },
            });
          }
        }
      }
      return true;
    },

    // هر زمان که توکن دریافت می‌شود، اطلاعات جدید رو به توکن اضافه می‌کنیم
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.userRole = user.role;
        token.userPhone = user.phone; // اطلاعات موبایل ذخیره نمی‌شود، در صورت نیاز این قسمت رو اصلاح کن
      }
      return token;
    },

    // اطلاعات تکمیل‌شده کاربر در سشن
    async session({ session, token }) {
      session.user = {
        ...session.user,
        userId: token.userId,
        userRole: token.userRole,
        userPhone: token.userPhone,
      };
      return session;
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
