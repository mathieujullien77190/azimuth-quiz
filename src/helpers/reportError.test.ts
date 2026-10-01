import { useErrorNotice } from './errorNotice';
import { reportError, reporting, resetErrorThrottle, setErrorReporter, type ErrorRecord } from './reportError';

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

let consoleError: jest.SpyInstance;
let consoleDebug: jest.SpyInstance;
let now = 1_000_000;
const sink = jest.fn<Promise<void>, [ErrorRecord]>(() => Promise.resolve());

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(Date, 'now').mockImplementation(() => now);
  sink.mockReset();
  sink.mockImplementation(() => Promise.resolve());
  resetErrorThrottle();
  setErrorReporter(sink);
  useErrorNotice.setState({ visible: false });
});

afterEach(() => {
  jest.restoreAllMocks();
  setErrorReporter(null);
});

describe('reportError', () => {
  it('logs to the console and tells the player when one of their own actions failed', () => {
    reportError('silhouette.revealHint', new Error('boom'));
    expect(consoleError).toHaveBeenCalledWith('[silhouette.revealHint]', expect.any(Error));
    expect(useErrorNotice.getState().visible).toBe(true);
  });

  it('keeps upkeep errors away from the player', () => {
    reportError('room.heartbeat', new Error('boom'), { kind: 'background' });
    expect(consoleDebug).toHaveBeenCalledWith('[room.heartbeat]', expect.any(Error));
    expect(consoleError).not.toHaveBeenCalled();
    expect(useErrorNotice.getState().visible).toBe(false);
  });

  it('records the action, the Firestore code, the message and the room', async () => {
    const denied = Object.assign(new Error('Missing or insufficient permissions'), { code: 'permission-denied' });
    reportError('clues.pickClue', denied, { room: 'tabofuna' });
    await flush();
    expect(sink).toHaveBeenCalledWith({
      action: 'clues.pickClue',
      code: 'permission-denied',
      message: 'Missing or insufficient permissions',
      room: 'tabofuna',
      kind: 'game',
      repeats: 0,
    });
  });

  it('falls back to the error name, then to "unknown", when there is no string code', async () => {
    reportError('a', new TypeError('bad'));
    reportError('b', Object.assign(new Error('x'), { code: 42 }));
    reportError('c', 'just a string');
    reportError('d', null);
    await flush();
    expect(sink.mock.calls.map(([record]) => [record.code, record.message])).toEqual([
      ['TypeError', 'bad'],
      ['Error', 'x'],
      ['unknown', 'just a string'],
      ['unknown', 'null'],
    ]);
  });

  it('cuts a long message', async () => {
    reportError('long', new Error('x'.repeat(500)));
    await flush();
    expect(sink.mock.calls[0][0].message).toHaveLength(300);
  });

  it('holds back the same error inside the interval and counts the repeats on the next record', async () => {
    reportError('game.act', new Error('x'), { room: 'r' });
    now += 5_000;
    reportError('game.act', new Error('x'), { room: 'r' });
    reportError('game.act', new Error('x'), { room: 'r' });
    now += 6_000;
    reportError('game.act', new Error('x'), { room: 'r' });
    await flush();
    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink.mock.calls[1][0].repeats).toBe(2);
  });

  it('lets upkeep through less often than game actions', async () => {
    reportError('room.heartbeat', new Error('x'), { kind: 'background' });
    now += 30_000;
    reportError('room.heartbeat', new Error('x'), { kind: 'background' });
    now += 31_000;
    reportError('room.heartbeat', new Error('x'), { kind: 'background' });
    await flush();
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('treats another action, code or room as another error', async () => {
    reportError('game.act', new Error('x'), { room: 'one' });
    reportError('game.act', new Error('x'), { room: 'two' });
    reportError('game.other', new Error('x'), { room: 'one' });
    reportError('game.act', Object.assign(new Error('x'), { code: 'unavailable' }), { room: 'one' });
    await flush();
    expect(sink).toHaveBeenCalledTimes(4);
  });

  it('only logs when nothing was installed to record', () => {
    setErrorReporter(null);
    expect(() => reportError('game.act', new Error('x'))).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
  });

  it('never fails because the record could not be written', async () => {
    sink.mockRejectedValueOnce(new Error('quota'));
    reportError('game.a', new Error('x'));
    sink.mockImplementationOnce(() => {
      throw new Error('sync');
    });
    reportError('game.b', new Error('x'));
    await flush();
    expect(sink).toHaveBeenCalledTimes(2);
  });
});

describe('reporting', () => {
  it('builds the handler that replaces a silent catch', async () => {
    await Promise.reject(new Error('boom')).catch(reporting('room.leave', { kind: 'background', room: 'abc' }));
    await flush();
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ action: 'room.leave', room: 'abc', kind: 'background' }));
  });

  it('works without options', async () => {
    await Promise.reject(new Error('boom')).catch(reporting('room.leave'));
    await flush();
    expect(sink).toHaveBeenCalledWith(expect.objectContaining({ action: 'room.leave', room: null, kind: 'game' }));
  });
});
