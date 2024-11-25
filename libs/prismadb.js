/* eslint-disable no-undef */

import { PrismaClient } from '@prisma/client';

let prismadb;

if (!global.prismadb) {
  global.prismadb = new PrismaClient();
}

prismadb = global.prismadb;

export default prismadb;
