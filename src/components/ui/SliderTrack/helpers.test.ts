import { clamp01, markLeft, ratioFromTouch, thumbCenter } from './helpers';

describe('clamp01', () => {
  it('passes values already within [0, 1] through unchanged', () => {
    expect(clamp01(0.4)).toBe(0.4);
  });

  it('clamps below 0 up to 0', () => {
    expect(clamp01(-1)).toBe(0);
  });

  it('clamps above 1 down to 1', () => {
    expect(clamp01(2)).toBe(1);
  });
});

describe('ratioFromTouch', () => {
  it('maps a touch at the thumb center of the track to ratio 0', () => {
    expect(ratioFromTouch(15, 300, 30)).toBe(0);
  });

  it('maps a touch at the far end of the track to ratio 1', () => {
    expect(ratioFromTouch(285, 300, 30)).toBe(1);
  });

  it('clamps touches before the start or past the end of the track', () => {
    expect(ratioFromTouch(-50, 300, 30)).toBe(0);
    expect(ratioFromTouch(1000, 300, 30)).toBe(1);
  });
});

describe('thumbCenter', () => {
  it('is at thumbSize/2 for ratio 0', () => {
    expect(thumbCenter(0, 300, 30)).toBe(15);
  });

  it('is at width - thumbSize/2 for ratio 1', () => {
    expect(thumbCenter(1, 300, 30)).toBe(285);
  });

  it('clamps an out-of-range ratio', () => {
    expect(thumbCenter(-1, 300, 30)).toBe(15);
    expect(thumbCenter(2, 300, 30)).toBe(285);
  });
});

describe('markLeft', () => {
  it('centers the label on the thumb position when there is room', () => {
    expect(markLeft(0.5, 300, 30, 60)).toBe(thumbCenter(0.5, 300, 30) - 30);
  });

  it('never goes below 0 (label would overflow the left edge)', () => {
    expect(markLeft(0, 300, 30, 60)).toBe(0);
  });

  it('never overflows the right edge of the track', () => {
    expect(markLeft(1, 300, 30, 60)).toBe(300 - 60);
  });
});
