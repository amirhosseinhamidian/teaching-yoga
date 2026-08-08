import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanOptionalString = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
};

const serializeSiteInfo = (siteInfo) => {
  if (!siteInfo) {
    return null;
  }

  return {
    ...siteInfo,

    /*
     * خود heroImage و teachingMethodImage
     * همان storage key دیتابیس باقی می‌مانند.
     *
     * این دو فیلد برای نمایش در Client هستند.
     */
    heroImageUrl: siteInfo.heroImage
      ? toAbsoluteMediaUrl(siteInfo.heroImage)
      : null,

    teachingMethodImageUrl: siteInfo.teachingMethodImage
      ? toAbsoluteMediaUrl(siteInfo.teachingMethodImage)
      : null,
  };
};

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      shortDescription,
      fullDescription,
      companyAddress,
      companyEmail,
      companyPhone,
      socialLinks,
      coursesLinks,
      articlesLinks,
      usefulLinks,

      /*
       * فیلدهای جدید/اصلی Media
       */
      heroImage,
      teachingMethodImage,

      /*
       * فقط برای سازگاری موقت
       * با Client خیلی قدیمی.
       */
      heroImageUrl,

      rules,
    } = body;

    const siteInfo = await prismadb.siteInfo.create({
      data: {
        shortDescription,
        fullDescription,
        companyAddress,
        companyEmail,
        companyPhone,
        socialLinks,
        coursesLinks,
        articlesLinks,
        usefulLinks,

        heroImage:
          cleanOptionalString(heroImage) || cleanOptionalString(heroImageUrl),

        teachingMethodImage: cleanOptionalString(teachingMethodImage),

        rules,
      },
    });

    return NextResponse.json(serializeSiteInfo(siteInfo), {
      status: 201,
    });
  } catch (error) {
    console.error('[SITE_INFO_POST_ERROR]', error);

    return NextResponse.json(
      {
        message: 'Error creating site information',
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PUT
|--------------------------------------------------------------------------
*/

export async function PUT(req) {
  try {
    const body = await req.json();

    const {
      id,
      shortDescription,
      fullDescription,
      companyAddress,
      companyEmail,
      companyPhone,
      socialLinks,
      coursesLinks,
      articlesLinks,
      usefulLinks,
      heroImage,
      teachingMethodImage,
      rules,
    } = body;

    if (!id) {
      return NextResponse.json(
        {
          message: 'Site info ID is required',
        },
        {
          status: 400,
        }
      );
    }

    const updatedSiteInfo = await prismadb.siteInfo.update({
      where: {
        id,
      },

      data: {
        shortDescription,
        fullDescription,
        companyAddress,
        companyEmail,
        companyPhone,
        socialLinks,
        coursesLinks,
        articlesLinks,
        usefulLinks,

        heroImage: cleanOptionalString(heroImage),

        teachingMethodImage: cleanOptionalString(teachingMethodImage),

        rules,
      },
    });

    return NextResponse.json(serializeSiteInfo(updatedSiteInfo), {
      status: 200,
    });
  } catch (error) {
    console.error('[SITE_INFO_PUT_ERROR]', error);

    return NextResponse.json(
      {
        message: 'Error updating site information',
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET() {
  try {
    const siteInfo = await prismadb.siteInfo.findFirst();

    if (!siteInfo) {
      return NextResponse.json(null, {
        status: 200,
      });
    }

    return NextResponse.json(serializeSiteInfo(siteInfo), {
      status: 200,
    });
  } catch (error) {
    console.error('[SITE_INFO_GET_ERROR]', error);

    return NextResponse.json(
      {
        message: 'Error fetching site information',
      },
      {
        status: 500,
      }
    );
  }
}
