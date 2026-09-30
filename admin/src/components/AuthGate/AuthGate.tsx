import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { compassNumberingPending, loadData, numberCompassPlaces } from '../../data';
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

  const runNumbering = () => {
    setError(null);
    setProgress('Écriture…');
    numberCompassPlaces((done, total) => setProgress(`Écriture : ${done} / ${total}`))
      .then(() => setProgress(null))
      .catch((err: Error) => {
        setProgress(null);
        setError(err.message);
      });
  };

  const signIn = () => {
    setError(null);
    signInWithPopup(auth, new GoogleAuthProvider()).catch((err: Error) => setError(err.message));
  };

  if (user === undefined) return <div className="empty">Connexion…</div>;

  // Compass places not numbered yet (or counts out of sync): the game's random draw needs `n` on every
  // Compass place and `meta/compassCounts`, see `data/firestore/numbering.ts`.
  if (isAdmin && phase === 'ready' && (progress !== null || compassNumberingPending())) {
    return (
      <div className="wrap">
        <div className="empty">
          <p>Les lieux Compass ne sont pas (bien) numérotés : le tirage au sort des lieux du jeu en a besoin.</p>
          {error && <p>{error}</p>}
          <button className="reset" type="button" disabled={progress !== null} onClick={runNumbering}>
            {progress ?? 'Numéroter les lieux Compass'}
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
