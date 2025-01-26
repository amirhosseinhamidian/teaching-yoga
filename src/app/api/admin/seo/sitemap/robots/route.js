/* eslint-disable no-undef */

export async function GET() {
  const robots = `
      User-agent: *
      Allow: /
      Sitemap: ${process.env.NEXT_PUBLIC_API_BASE_URL}/sitemap.xml
    `;
  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
