import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import {
  cluesNumberingBroken,
  cluesNumberingPending,
  compassNumberingBroken,
  compassNumberingPending,
  contourMigrationPending,
  copyClueDataIntoPlaces,
  copyCountryIntoPlaces,
  loadData,
  migrateContours,
  numberCluesPlaces,
  numberCompassPlaces,
  placesMissingClueCopies,
  placesMissingCountry,
} from '../../data';
import { ADMIN_EMAIL, auth } from '../../firebase';

type Phase = 'auth' | 'loading' | 'ready';

/** A one-off data migration the admin insists on before anything else: detected from the data itself
 * (idempotent, an interrupted run is simply offered again), run in the order of `STEPS`. */
type Step = {
  pending: () => boolean;
  message: () => string;
  button: () => string;
  run: (onProgress: (done: number, total: number) => void) => Promise<void>;
};

const STEPS: Step[] = [
  {
    // Compass places not numbered yet, counts out of sync, or numbered in the import order: the game's cursor
    // draw needs `n` on every Compass place (in the shuffled order) and `meta/compassCounts`, see
    // `data/firestore/numbering.ts`.
    pending: compassNumberingPending,
    message: () =>
      compassNumberingBroken()
        ? 'Les lieux Compass ne sont pas (bien) numérotés : le tirage des lieux du jeu en a besoin.'
        : 'Les lieux Compass sont numérotés dans l’ordre d’import : mélange la numérotation pour que le tirage des lieux du jeu varie.',
    button: () => (compassNumberingBroken() ? 'Numéroter les lieux Compass' : 'Mélanger la numérotation Compass'),
    run: numberCompassPlaces,
  },
  {
    // The game shows a place's country without looking it up: every place carries a copy of it.
    pending: () => placesMissingCountry().length > 0,
    message: () =>
      `${placesMissingCountry().length} lieux ne portent pas (à jour) la copie de leur pays (nom, drapeau, devise, indicatif) : le jeu s’en sert pour ne rien chercher.`,
    button: () => 'Copier les infos pays dans les lieux',
    run: copyCountryIntoPlaces,
  },
  {
    // Same numbering as Compass, for the Clues groups (`clues.category` x difficulty).
    pending: cluesNumberingPending,
    message: () =>
      cluesNumberingBroken()
        ? 'Les lieux Indices ne sont pas (bien) numérotés : le tirage des lieux du jeu en a besoin.'
        : 'Les lieux Indices sont numérotés dans l’ordre d’import : mélange la numérotation pour que le tirage varie.',
    button: () => (cluesNumberingBroken() ? 'Numéroter les lieux Indices' : 'Mélanger la numérotation Indices'),
    run: numberCluesPlaces,
  },
  {
    // A Clues round reads nothing but the place it drew: the riddle of each syllable and the label of the
    // personality's job are copied into the place (`clues.riddles`, `personality.job`).
    pending: () => placesMissingClueCopies().length > 0,
    message: () =>
      `${placesMissingClueCopies().length} lieux ne portent pas (à jour) les devinettes de leurs syllabes ni le métier de leur personnalité : le jeu Indices s’en sert pour ne rien chercher.`,
    button: () => 'Copier devinettes et métiers dans les lieux',
    run: copyClueDataIntoPlaces,
  },
  {
    // Silhouettes leave the countries list for their own documents, with names, capital and cities copied in.
    pending: contourMigrationPending,
    message: () =>
      'Les silhouettes sont encore dans les pays : elles passent dans leurs propres documents (avec les noms, la capitale et les villes) et sont numérotées par difficulté.',
    button: () => 'Migrer les contours',
    run: migrateContours,
  },
];

/**
 * Google sign-in, restricted to `ADMIN_EMAIL`, then loads every collection into memory (`loadData`)
 * before rendering `children` — so the views can read the data synchronously. The real gate is
 * `firestore.rules` (`isAdmin()`): a visitor with another account would see nothing writable anyway.
 * An anonymous session (the game shares this origin on GitHub Pages) counts as signed out.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>('auth');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  // The step being run keeps its screen up until it finishes, even once the data no longer says "pending".
  const [running, setRunning] = useState<Step | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const isAdmin = user?.email === ADMIN_EMAIL;

  const load = useCallback(() => {
    setPhase('loading');
    setError(null);
    loadData()
      .then(() => setPhase('ready'))
      .catch((err: Error) => {
        setError(err.message);
        setPhase('auth');
      });
  }, []);

  useEffect(() => {
    if (isAdmin) load();
    else setPhase('auth');
  }, [isAdmin, load]);

  const runStep = (step: Step) => {
    setError(null);
    setRunning(step);
    setProgress('Écriture…');
    step
      .run((done, total) => setProgress(`Écriture : ${done} / ${total}`))
      .then(() => setRunning(null))
      .catch((err: Error) => setError(err.message))
      .finally(() => setProgress(null));
  };

  const signIn = () => {
    setError(null);
    signInWithPopup(auth, new GoogleAuthProvider()).catch((err: Error) => setError(err.message));
  };

  if (user === undefined) return <div className="empty">Connexion…</div>;

  const step = isAdmin && phase === 'ready' ? (running ?? STEPS.find((candidate) => candidate.pending())) : undefined;
  if (step) {
    return (
      <div className="wrap">
        <div className="empty">
          <p>{step.message()}</p>
          {error && <p>{error}</p>}
          <button className="reset" type="button" disabled={progress !== null} onClick={() => runStep(step)}>
            {progress ?? step.button()}
          </button>
        </div>
      </div>
    );
  }
  if (isAdmin && phase === 'ready') return <>{children}</>;
  if (isAdmin && phase === 'loading') return <div className="empty">Chargement des données…</div>;

  return (
    <div className="wrap">
      <div className="empty">
        {user?.email && !isAdmin && <p>Ce compte ({user.email}) n'a pas accès à l'admin.</p>}
        {error && <p>{error}</p>}
        {isAdmin ? (
          <button className="reset" type="button" onClick={load}>
            Réessayer
          </button>
        ) : (
          <button className="reset" type="button" onClick={signIn}>
            Se connecter avec Google
          </button>
        )}
        {user?.email && (
          <button className="reset" type="button" onClick={() => signOut(auth)}>
            Se déconnecter
          </button>
        )}
      </div>
    </div>
  );
};
