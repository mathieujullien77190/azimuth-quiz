import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { data, loadData } from '../../data';
import { ADMIN_EMAIL, auth } from '../../firebase';
import { migratePlaceIds, pendingPlaceMoves } from '../../migratePlaceIds';
import { seedFirestore } from '../../seed';

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

  const runSeed = () => {
    setError(null);
    setProgress('Import…');
    seedFirestore((written, total) => setProgress(`Import : ${written} / ${total}`))
      .then(() => {
        setProgress(null);
        load();
      })
      .catch((err: Error) => {
        setProgress(null);
        setError(err.message);
      });
  };

  const runMigration = () => {
    setError(null);
    setProgress('Migration…');
    migratePlaceIds((moved, total) => setProgress(`Migration : ${moved} / ${total}`))
      .then(() => {
        setProgress(null);
        load();
      })
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

  // Empty database: offer the one-off import of the bundled JSON instead of an admin with nothing in it.
  if (isAdmin && phase === 'ready' && Object.keys(data().places).length === 0) {
    return (
      <div className="wrap">
        <div className="empty">
          <p>Firestore est vide. Importer les données embarquées (lieux, pays, syllabes, métiers) ?</p>
          {error && <p>{error}</p>}
          <button className="reset" type="button" disabled={progress !== null} onClick={runSeed}>
            {progress ?? 'Importer les données'}
          </button>
        </div>
      </div>
    );
  }
  // Places imported under their 3-letter key: move them once to their readable id (`fr-paris`).
  if (isAdmin && phase === 'ready' && pendingPlaceMoves().length > 0) {
    return (
      <div className="wrap">
        <div className="empty">
          <p>Migration des identifiants de lieux : {pendingPlaceMoves().length} lieux passent de « par » à « fr-paris ».</p>
          {error && <p>{error}</p>}
          <button className="reset" type="button" disabled={progress !== null} onClick={runMigration}>
            {progress ?? 'Migrer les identifiants'}
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
