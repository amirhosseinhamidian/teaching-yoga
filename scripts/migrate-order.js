import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("📌 شروع انتقال order از Session → SessionTerm ...");

  const sessions = await prisma.session.findMany({
    select: { id: true, termId: true, order: true }
  });

  let updated = 0;

  for (const s of sessions) {
    if (!s.termId || s.order == null) continue;

    await prisma.sessionTerm.updateMany({
      where: {
        sessionId: s.id,
        termId: s.termId,
      },
      data: {
        order: s.order,
      }
    });

    updated++;
  }

  console.log(`✅ انتقال order برای ${updated} رکورد انجام شد`);
}

main().finally(() => prisma.$disconnect());
