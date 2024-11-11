import prismadb from '../../../../libs/prismadb';
export async function POST(request) {
  const { phone, code } = await request.json();

  // check find code
  const verificationEntry = await prismadb.verificationCode.findUnique({
    where: { phone },
  });

  if (!verificationEntry) {
    return new Response(
      JSON.stringify({ success: false, message: 'کد تأیید یافت نشد.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const { code: storedCode, expiresAt } = verificationEntry;

  // check code expire time
  if (storedCode !== Number(code)) {
    return new Response(
      JSON.stringify({ success: false, message: 'کد تأیید نادرست است.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  if (new Date() > new Date(expiresAt)) {
    return new Response(
      JSON.stringify({ success: false, message: 'کد تأیید منقضی شده است.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: 'کد تأیید موفقیت‌آمیز بود.' }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
