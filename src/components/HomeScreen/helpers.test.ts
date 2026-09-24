import { HELICOPTER_FOOTPRINT, HELICOPTER_PAUSE_OPTIONS_S } from './constants';
import { randomHelicopterPauseSeconds, randomHelicopterPosition } from './helpers';

describe('randomHelicopterPosition', () => {
  it('stays within the zone, footprint included', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const position = randomHelicopterPosition(400, 200);
    expect(position.left).toBe(Math.round(0.5 * (400 - HELICOPTER_FOOTPRINT.width)));
    expect(position.top).toBe(Math.round(0.5 * (200 - HELICOPTER_FOOTPRINT.height)));
    randomSpy.mockRestore();
  });

  it('never goes negative when the zone is smaller than the footprint', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9);
    const position = randomHelicopterPosition(10, 10);
    expect(position.left).toBe(0);
    expect(position.top).toBe(0);
    randomSpy.mockRestore();
  });
});

describe('randomHelicopterPauseSeconds', () => {
  it('always picks one of HELICOPTER_PAUSE_OPTIONS_S', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(HELICOPTER_PAUSE_OPTIONS_S).toContain(randomHelicopterPauseSeconds());
    }
  });

  it('can pick the first option (Math.random near 0)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomHelicopterPauseSeconds()).toBe(HELICOPTER_PAUSE_OPTIONS_S[0]);
    randomSpy.mockRestore();
  });

  it('can pick the last option (Math.random near 1)', () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.999);
    expect(randomHelicopterPauseSeconds()).toBe(HELICOPTER_PAUSE_OPTIONS_S[HELICOPTER_PAUSE_OPTIONS_S.length - 1]);
    randomSpy.mockRestore();
  });
});
