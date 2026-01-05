export function buildProductUrl(product) {
  const safeUrlSlug = product?.urlSlug || 'product';
  return `/shop/products/${product.id}-${safeUrlSlug}`;
}
