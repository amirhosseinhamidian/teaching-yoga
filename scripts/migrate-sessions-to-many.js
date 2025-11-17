// scripts/migrate-sessions-to-many.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📌 شروع انتقال داده‌های Session → SessionTerm ...");

  // همه‌ی سشن‌هایی که termId دارند را بگیر
  const sessions = await prisma.session.findMany({
    select: {
      id: true,
      termId: true,
    },
  });

  let createdCount = 0;

  for (const s of sessions) {
    // سشن‌هایی که ممکن است termId نداشته باشند را رد کن
    if (!s.termId) continue;

    try {
      await prisma.sessionTerm.create({
        data: {
          sessionId: s.id,
          termId: s.termId,
        },
      });

      createdCount++;
    } catch (err) {
      if (err.code === "P2002") {
        // وجود رکورد تکراری — مشکلی نیست
        console.log(`⚠️ قبلاً ثبت شده: sessionId=${s.id}, termId=${s.termId}`);
      } else {
        console.error("❌ خطا:", err);
      }
    }
  }

  console.log(`✅ انتقال کامل شد — تعداد رکورد اضافه‌شده: ${createdCount}`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
