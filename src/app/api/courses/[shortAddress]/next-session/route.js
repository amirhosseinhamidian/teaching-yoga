import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';

export async function GET(req, { params }) {
  const { shortAddress } = params;

  const authUser = getAuthUser();
  const userId = authUser?.id || null;

  if (!userId) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 }
    );
  }

  try {
    // 1) دوره را پیدا کن (برای courseId لازم داریم)
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      select: { id: true, shortAddress: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    }

    const courseId = course.id;

    // 2) دسترسی کاربر: خرید مستقیم یا اشتراک فعال که دوره داخل پلن‌اش هست
    const now = new Date();

    const [hasPurchasedDirect, hasSubscriptionAccess] = await Promise.all([
      prismadb.userCourse.findFirst({
        where: {
          userId,
          courseId,
          // اگر می‌خوای فقط اکتیوها:
          status: 'ACTIVE',
        },
        select: { id: true },
      }),

      prismadb.userSubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: now },
          plan: {
            planCourses: {
              some: { courseId },
            },
          },
        },
        select: { id: true },
      }),
    ]);

    const hasAccess = !!hasPurchasedDirect || !!hasSubscriptionAccess;

    if (!hasAccess) {
      return NextResponse.json(
        {
          error:
            'User has no access to this course (purchase or subscription required).',
        },
        { status: 403 }
      );
    }

    // 3) کل ساختار ترم‌ها و جلسات دوره را بگیر
    const courseWithTerms = await prismadb.course.findUnique({
      where: { id: courseId },
      include: {
        courseTerms: {
          // اگر ترتیب خاصی می‌خوای (مثلاً جدیدتر اول/آخر) تنظیم کن
          orderBy: { termId: 'desc' },
          include: {
            term: {
              include: {
                sessionTerms: {
                  include: { session: true },
                  orderBy: { session: { order: 'asc' } },
                },
              },
            },
          },
        },
      },
    });

    const courseTerms = courseWithTerms?.courseTerms || [];

    // تبدیل sessionTerms → sessions[]
    for (const ct of courseTerms) {
      const term = ct.term;

      term.sessions = (term.sessionTerms || [])
        .map((st) => st.session)
        .filter(Boolean)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // 4) بهینه: همه جلسات این دوره را یکجا جمع کن و progress های completed را یکجا بگیر
    const allSessionIds = courseTerms
      .flatMap((ct) => ct.term?.sessions || [])
      .map((s) => s.id);

    const completed = await prismadb.sessionProgress.findMany({
      where: {
        userId,
        sessionId: { in: allSessionIds },
        isCompleted: true,
      },
      select: { sessionId: true },
    });

    const completedSet = new Set(completed.map((x) => x.sessionId));

    // 5) پیدا کردن اولین جلسه‌ای که کامل نشده و فعال است
    let nextSession = null;

    for (const courseTerm of courseTerms) {
      for (const session of courseTerm.term.sessions) {
        if (!session?.isActive) continue;
        if (!completedSet.has(session.id)) {
          nextSession = session;
          break;
        }
      }
      if (nextSession) break;
    }

    // 6) fallback اگر همه کامل شده بودند یا پیدا نشد
    if (!nextSession) {
      // ۱) اولین جلسه فعال از آخرین ترم
      for (const courseTerm of [...courseTerms].reverse()) {
        const active = courseTerm.term.sessions.find((s) => s?.isActive);
        if (active) {
          nextSession = active;
          break;
        }
      }

      // ۲) fallback نهایی: اولین جلسه اولین ترم موجود
      if (!nextSession) {
        const fallback = courseTerms.at(-1)?.term.sessions?.at(0);
        if (fallback) nextSession = fallback;
      }
    }

    if (!nextSession?.id) {
      return NextResponse.json(
        { error: 'No session found for this course.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ sessionId: nextSession.id }, { status: 200 });
  } catch (error) {
    console.error('Next session error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
