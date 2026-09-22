export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Position [0, 1] correspondant a un toucher a `x`, la poignee restant dans la piste. */
export const ratioFromTouch = (x: number, width: number, thumbSize: number): number =>
  clamp01((x - thumbSize / 2) / Math.max(1, width - thumbSize));

/** Abscisse du centre de la poignee pour une position [0, 1]. */
export const thumbCenter = (ratio: number, width: number, thumbSize: number): number =>
  thumbSize / 2 + clamp01(ratio) * Math.max(0, width - thumbSize);

/** Abscisse gauche d'un repere centre sur sa position, sans deborder de la piste. */
export const markLeft = (ratio: number, width: number, thumbSize: number, labelWidth: number): number =>
  Math.min(Math.max(thumbCenter(ratio, width, thumbSize) - labelWidth / 2, 0), Math.max(0, width - labelWidth));
