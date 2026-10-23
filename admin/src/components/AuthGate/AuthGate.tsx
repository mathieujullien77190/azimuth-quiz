import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { loadData } from '../../data';
import { ADMIN_EMAILS, auth } from '../../firebase';

type Phase = 'auth' | 'loading' | 'ready';

/**
 * Connexion Google limitee a `ADMIN_EMAILS`, puis charge toutes les collections en memoire (`loadData`) avant de
 * rendre `children`, pour que les vues lisent en synchrone. La vraie barriere est `firestore.rules`. Une session
 * anonyme (le jeu partage cette origine) compte comme deconnectee.
 */
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>('auth');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  const isAdmin = user?.email != null && ADMIN_EMAILS.includes(user.email);

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
