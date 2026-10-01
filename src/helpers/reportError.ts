import { useErrorNotice } from './errorNotice';

/** `game`: an action the player just made (hint, answer, score...) — also told to the player. `background`: upkeep the
 * player never asked for (presence heartbeat, live typing, cleanup...) — logged only. */
export type ErrorKind = 'game' | 'background';

/** What reaches the error log (`errors` collection, see `errorSink.ts`). */
export type ErrorRecord = {
  action: string;
  code: string;
  message: string;
  room: string | null;
  kind: ErrorKind;
  /** How many identical errors were held back since the previous record. */
  repeats: number;
};

type ReportOptions = { kind?: ErrorKind; room?: string | null };
type Reporter = (record: ErrorRecord) => Promise<void>;

/** The same error (same action, code and room) is recorded at most once per interval: a game action is rarely repeated
 * so it is let through quickly, upkeep fires in bursts (every heartbeat, every keystroke) so it is held back longer. */
const INTERVAL_MS: Record<ErrorKind, number> = { game: 10_000, background: 60_000 };
const MAX_MESSAGE_LENGTH = 300;

let reporter: Reporter | null = null;
const lastRecorded = new Map<string, { at: number; held: number }>();

/** Where records go (installed once at launch, see `app/_layout.tsx`); `null` = nowhere, the error is only logged. */
export const setErrorReporter = (next: Reporter | null): void => {
  reporter = next;
};

export const resetErrorThrottle = (): void => {
  lastRecorded.clear();
};

const codeOf = (error: unknown): string => {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  if (typeof code === 'string') return code;
  return error instanceof Error ? error.name : 'unknown';
};

const messageOf = (error: unknown): string =>
  (error instanceof Error ? error.message : String(error)).slice(0, MAX_MESSAGE_LENGTH);

/**
 * Where a failed Firestore write used to vanish (`.catch(() => {})`): logs it to the console (as an error only for the player's own actions), tells the player when it
 * was one of their own actions, and records it in the error log (throttled, see `INTERVAL_MS`). Never throws and never
 * reports its own failures: a log that cannot be written is simply lost.
 */
export const reportError = (action: string, error: unknown, { kind = 'game', room = null }: ReportOptions = {}): void => {
  // Upkeep stays out of the console's error channel: dev builds turn every console.error into a red toast on screen.
  if (kind === 'game') {
    console.error(`[${action}]`, error);
    useErrorNotice.getState().show();
  } else {
    console.debug(`[${action}]`, error);
  }

  const code = codeOf(error);
  const key = `${action}|${code}|${room}`;
  const now = Date.now();
  const previous = lastRecorded.get(key);
  if (previous !== undefined && now - previous.at < INTERVAL_MS[kind]) {
    previous.held += 1;
    return;
  }
  lastRecorded.set(key, { at: now, held: 0 });
  const current = reporter;
  if (current === null) return;
  const record: ErrorRecord = { action, code, message: messageOf(error), room, kind, repeats: previous?.held ?? 0 };
  Promise.resolve()
    .then(() => current(record))
    .catch(() => {});
};

/** `.catch(reporting('silhouette.revealHint', { room }))`: the handler that replaces the silent `.catch(() => {})`. */
export const reporting =
  (action: string, options?: ReportOptions) =>
  (error: unknown): void =>
    reportError(action, error, options);
