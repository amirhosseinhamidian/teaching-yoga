import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

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
    // 1) خودِ دوره را پیدا کن
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      select: {
        id: true,
        shortAddress: true,
        activeStatus: true,
        courseTerms: {
          orderBy: { termId: 'asc' },
          include: {
            term: {
              include: {
                sessionTerms: {
                  include: { session: true },
                  // اگر sessionTerms order دارد می‌توانی اینجا هم orderBy بذاری
                  // ولی معمولاً سشن order روی خود session است
                },
              },
            },
          },
        },
      },
    });

    if (!course || !course.activeStatus) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const courseId = course.id;

    // 2) دسترسی: خرید مستقیم (userCourse)
    const directAccess = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    // 3) دسترسی: اشتراک فعال + دوره داخل پلن
    const now = new Date();

    const subscriptionAccess = await prismadb.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE', // اگر enum شما چیز دیگری است، مطابق اسکیمای خودت تغییر بده
        startDate: { lte: now },
        endDate: { gte: now },
        plan: {
          planCourses: {
            some: { courseId },
          },
        },
      },
      select: { id: true },
    });

    const hasAccess = !!directAccess || !!subscriptionAccess;

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'User has no access to this course.' },
        { status: 403 }
      );
    }

    // 4) پیدا کردن اولین جلسه معتبر (با ترتیب درست session.order)
    // تبدیل sessionTerms -> sessions و sort
    const terms = (course.courseTerms || [])
      .map((ct) => ct.term)
      .filter(Boolean);

    let firstValidSession = null;

    for (const term of terms) {
      const sessions = (term.sessionTerms || [])
        .map((st) => st.session)
        .filter(Boolean)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      for (const s of sessions) {
        const hasMedia =
          (s.type === 'VIDEO' && !!s.videoId) ||
          (s.type === 'AUDIO' && !!s.audioId);

        if (s.isActive && hasMedia) {
          firstValidSession = s;
          break;
        }
      }

      if (firstValidSession) break;
    }

    if (!firstValidSession) {
      return NextResponse.json(
        { error: 'No valid session found for this course.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        sessionId: firstValidSession.id,
        sessionType: firstValidSession.type,
        access: directAccess ? 'DIRECT' : 'SUBSCRIPTION', // برای دیباگ/UI مفید است
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching first session:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
