export function normalizeUrlSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u200c]+/g, '-') // فاصله/نیم‌فاصله → -
    .replace(/[^a-z0-9\u0600-\u06FF-]/gi, '') // اجازه فارسی + انگلیسی + عدد + -
    .replace(/-+/g, '-') // چندتا - پشت سر هم → یکی
    .replace(/^-+|-+$/g, ''); // حذف - از ابتدا/انتها
}
