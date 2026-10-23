import { create } from 'zustand';

type ErrorNoticeState = {
  /** Une action de jeu vient d'echouer : la notice est affichee (voir `components/providers/ErrorNoticeHost`). */
  visible: boolean;
  show: () => void;
  hide: () => void;
};

export const useErrorNotice = create<ErrorNoticeState>()((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));

/** `game`: action que le joueur vient de faire (il est prevenu). `background`: entretien (presence, saisie...) : log seul. */
export type ErrorKind = 'game' | 'background';

/** Ce qui arrive dans le journal d'erreurs (collection `errors`, voir `errorSink.ts`). */
export type ErrorRecord = {
  action: string;
  code: string;
  message: string;
  room: string | null;
  kind: ErrorKind;
  /** Erreurs identiques retenues depuis le dernier enregistrement. */
  repeats: number;
};

type ReportOptions = { kind?: ErrorKind; room?: string | null };
type Reporter = (record: ErrorRecord) => Promise<void>;

/** Une meme erreur (action, code, room) n'est enregistree qu'une fois par intervalle : court pour le jeu,
 * long pour le fond (rafales : heartbeat, frappe). */
const INTERVAL_MS: Record<ErrorKind, number> = { game: 10_000, background: 60_000 };
const MAX_MESSAGE_LENGTH = 300;

let reporter: Reporter | null = null;
const lastRecorded = new Map<string, { at: number; held: number }>();

/** Destination des enregistrements (installee au lancement, `app/_layout.tsx`) ; `null` = log console seul. */
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

/** Remplace `.catch(() => {})` : log, previent le joueur si c'est son action, enregistre (limite). Ne leve jamais. */
export const reportError = (
  action: string,
  error: unknown,
  { kind = 'game', room = null }: ReportOptions = {},
): void => {
  // Le fond evite console.error : en dev il s'affiche en toast rouge.
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

/** `.catch(reporting('game.submitGuess', { room }))` : remplace le `.catch(() => {})` silencieux. */
export const reporting =
  (action: string, options?: ReportOptions) =>
  (error: unknown): void =>
    reportError(action, error, options);
