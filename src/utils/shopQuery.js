export function parseShopQuery(searchParams) {
  const sp = searchParams;

  const search = (sp.get('search') || '').trim();
  const categoryId = sp.get('categoryId') ? Number(sp.get('categoryId')) : null;

  const colorIds = (sp.get('colorIds') || '')
    .split(',')
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x > 0);

  const minPrice = sp.get('minPrice') ? Number(sp.get('minPrice')) : '';
  const maxPrice = sp.get('maxPrice') ? Number(sp.get('maxPrice')) : '';

  const inStock = sp.get('inStock') === 'true';

  const sort = sp.get('sort') || 'newest';

  const page = Math.max(1, Number(sp.get('page') || 1));
  const pageSize = Math.min(60, Math.max(1, Number(sp.get('pageSize') || 20)));

  return {
    search,
    categoryId: Number.isFinite(categoryId) ? categoryId : null,
    colorIds,
    minPrice: Number.isFinite(minPrice) ? minPrice : '',
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : '',
    inStock,
    sort,
    page,
    pageSize,
  };
}

export function buildShopQuery(q) {
  const sp = new URLSearchParams();

  if (q.search) sp.set('search', q.search);
  if (q.categoryId) sp.set('categoryId', String(q.categoryId));
  if (q.colorIds?.length) sp.set('colorIds', q.colorIds.join(','));

  if (q.minPrice !== '' && q.minPrice != null)
    sp.set('minPrice', String(q.minPrice));
  if (q.maxPrice !== '' && q.maxPrice != null)
    sp.set('maxPrice', String(q.maxPrice));

  if (q.inStock) sp.set('inStock', 'true');

  // sort rule: اگر categoryId نیست، فقط newest
  if (q.categoryId) {
    sp.set('sort', q.sort || 'newest');
  } else {
    sp.set('sort', 'newest');
  }

  sp.set('page', String(q.page || 1));
  sp.set('pageSize', String(q.pageSize || 20));

  return sp.toString();
}
