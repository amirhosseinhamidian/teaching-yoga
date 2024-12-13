export function calculateDiscount(price, basePrice) {
  return Math.ceil(((basePrice - price) / basePrice) * 100);
}
