/* eslint-disable react/prop-types */
'use client';

import { useEffect, React } from 'react';
import { reportClientError } from '@/utils/reportClientError';

const GlobalError = ({ error, reset }) => {
  useEffect(() => {
    reportClientError(error, {
      type: 'global_error_boundary',
      source: 'src/app/global-error.js',
      digest: error?.digest || null,
    });
  }, [error]);

  return (
    <html lang='fa' dir='rtl'>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f8fafc 0%, #f5f3ff 50%, #fff1f2 100%)',
          color: '#0f172a',
          fontFamily: 'Tahoma, Arial, sans-serif',
        }}
      >
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <section
            style={{
              width: '100%',
              maxWidth: '720px',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.9)',
              borderRadius: '32px',
              padding: '48px 32px',
              boxSizing: 'border-box',
              textAlign: 'center',
              boxShadow: '0 24px 80px rgba(15,23,42,0.12)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 20px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ede9fe, #ffe4e6)',
                color: '#7c3aed',
                fontSize: '32px',
              }}
            >
              !
            </div>

            <div
              style={{
                fontSize: '72px',
                lineHeight: 1,
                fontWeight: 900,
                color: '#7c3aed',
              }}
            >
              500
            </div>

            <h1
              style={{
                margin: '24px 0 12px',
                fontSize: '28px',
                lineHeight: 1.7,
              }}
            >
              مشکلی در اجرای سایت پیش آمد
            </h1>

            <p
              style={{
                maxWidth: '560px',
                margin: '0 auto',
                color: '#64748b',
                fontSize: '15px',
                lineHeight: 2,
              }}
            >
              در حال حاضر امکان نمایش کامل سایت وجود ندارد. با تلاش مجدد معمولاً
              مشکل برطرف می‌شود.
            </p>

            <div
              style={{
                marginTop: '32px',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <button
                type='button'
                onClick={() => reset()}
                style={{
                  minHeight: '44px',
                  border: 0,
                  borderRadius: '12px',
                  padding: '0 24px',
                  background: '#0f172a',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                تلاش مجدد
              </button>

              <a
                href='/'
                style={{
                  minHeight: '44px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  padding: '0 24px',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  color: '#334155',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                صفحه اصلی
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
