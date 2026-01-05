// src/utils/shipping/postex/selectPostexBoxId.js
/* eslint-disable no-undef */

/**
 * انتخاب جعبه مناسب بر اساس مجموع حجم مورد نیاز (approx):
 * - هر محصول یک packageBoxTypeId دارد
 * - حجم هر box * qty جمع می‌شود
 * - کوچک‌ترین box با حجم >= totalVolume انتخاب می‌شود
 *
 * @param {Object} args
 * @param {Array<{packageBoxTypeId?: number|null, qty?: number}>} args.items
 * @param {Array<{id:number, height:number, width:number, length:number}>} args.boxes
 * @param {number} [args.defaultBoxTypeId=13] - fallback (مثلاً "بزرگتر از 9")
 * @returns {number}
 */
export function selectPostexBoxId({
  items,
  boxes,
  defaultBoxTypeId = 13,
} = {}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeBoxes = Array.isArray(boxes) ? boxes : [];
  if (!safeItems.length || !safeBoxes.length) return Number(defaultBoxTypeId);

  // فقط باکس‌های معتبر (ابعاد > 0)
  const candidates = safeBoxes
    .map((b) => {
      const h = Number(b.height || 0);
      const w = Number(b.width || 0);
      const l = Number(b.length || 0);
      return {
        id: Number(b.id),
        h,
        w,
        l,
        volume: h * w * l,
      };
    })
    .filter((b) => b.id > 0 && b.h > 0 && b.w > 0 && b.l > 0 && b.volume > 0)
    .sort((a, b) => a.volume - b.volume);

  if (!candidates.length) return Number(defaultBoxTypeId);

  const boxMap = new Map(candidates.map((b) => [b.id, b]));
  const smallestValid = candidates[0];

  // مجموع حجم تقریبی موردنیاز
  let totalVolume = 0;

  for (const it of safeItems) {
    const qty = Math.max(1, Number(it?.qty ?? 1));
    const boxId =
      it?.packageBoxTypeId != null ? Number(it.packageBoxTypeId) : null;

    const used = (boxId && boxMap.get(boxId)) || smallestValid;

    totalVolume += used.volume * qty;
  }

  if (totalVolume <= 0) return Number(defaultBoxTypeId);

  const picked =
    candidates.find((b) => b.volume >= totalVolume) || candidates.at(-1);

  return Number(picked?.id || defaultBoxTypeId);
}
