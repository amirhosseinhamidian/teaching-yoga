import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prismadb from "./prismadb";

export const authOption = {
    adapter: PrismaAdapter(prismadb)
}