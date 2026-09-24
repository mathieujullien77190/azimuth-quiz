export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Position [0, 1] corresponding to a touch at `x`, keeping the thumb within the track. */
export const ratioFromTouch = (x: number, width: number, thumbSize: number): number =>
  clamp01((x - thumbSize / 2) / Math.max(1, width - thumbSize));

/** X coordinate of the thumb's center for a position [0, 1]. */
export const thumbCenter = (ratio: number, width: number, thumbSize: number): number =>
  thumbSize / 2 + clamp01(ratio) * Math.max(0, width - thumbSize);

/** Left X coordinate of a mark centered on its position, without overflowing the track. */
export const markLeft = (ratio: number, width: number, thumbSize: number, labelWidth: number): number =>
  Math.min(Math.max(thumbCenter(ratio, width, thumbSize) - labelWidth / 2, 0), Math.max(0, width - labelWidth));
