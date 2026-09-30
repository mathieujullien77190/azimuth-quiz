import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { contourMergePending, loadData, mergeContoursIntoCountries } from '../../data';
import { ADMIN_EMAIL, auth } from '../../firebase';

type Phase = 'auth' | 'loading' | 'ready';

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
  // The run keeps its screen up until it finishes, even once the data no longer says "pending".
  const [running, setRunning] = useState(false);

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

  const signIn = () => {
    setError(null);
    signInWithPopup(auth, new GoogleAuthProvider()).catch((err: Error) => setError(err.message));
  };

  if (user === undefined) return <div className="empty">Connexion…</div>;

  // One-off: the silhouettes move from the `contours` collection into their country's document, neighbours
  // merged in one list (see `mergeContoursIntoCountries`). Delete this screen once it has run everywhere.
  if (isAdmin && phase === 'ready' && (running || contourMergePending())) {
    const run = () => {
      setError(null);
      setRunning(true);
      setProgress('Écriture…');
      mergeContoursIntoCountries((done, total) => setProgress(`Écriture : ${done} / ${total}`))
        .then(() => setRunning(false))
        .catch((err: Error) => setError(err.message))
        .finally(() => setProgress(null));
    };
    return (
      <div className="wrap">
        <div className="empty">
          <p>
            Les silhouettes sont encore dans la collection « contours » : elles passent dans le document de leur pays
            (avec leurs voisins, en une seule liste), qu’un tour de jeu lira alors seul.
          </p>
          {error && <p>{error}</p>}
          <button className="reset" type="button" disabled={progress !== null} onClick={run}>
            {progress ?? 'Fusionner les contours dans les pays'}
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
