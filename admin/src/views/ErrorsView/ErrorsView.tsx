import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '../../firebase';

import { formatDate, groupErrors, MAX_ROWS } from './helpers';
import type { ErrorRow } from './types';

const toRow = (snapshot: QueryDocumentSnapshot): ErrorRow => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    action: data.action,
    code: data.code,
    message: data.message,
    room: data.room ?? null,
    kind: data.kind,
    repeats: data.repeats ?? 0,
    platform: data.platform,
    version: data.version,
    at: (data.at as Timestamp | null)?.toMillis() ?? Date.now(),
    expireAt: (data.expireAt as Timestamp).toMillis(),
  };
};

/**
 * What failed in the game, as the devices reported it (`reportError`). The newest 200 are read once, then a listener on
 * "newer than the latest one shown" adds the new ones by itself: nothing to refresh, and only the new documents are read.
 * Reads Firestore directly: these errors never go through the data copy or the journal.
 */
export const ErrorsView = () => {
  const [rows, setRows] = useState<ErrorRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let stop = () => {};
    const errors = collection(db, 'errors');
    getDocs(query(errors, orderBy('at', 'desc'), limit(200)))
      .then((snapshot) => {
        if (cancelled) return;
        setRows(snapshot.docs.map(toRow));
        const since = snapshot.docs[0]?.data().at ?? Timestamp.fromMillis(0);
        stop = onSnapshot(query(errors, where('at', '>', since), orderBy('at', 'asc')), (live) => {
          const added = live
            .docChanges()
            .filter((change) => change.type === 'added')
            .map((change) => toRow(change.doc))
            .reverse();
          if (added.length > 0) setRows((current) => [...added, ...(current ?? [])].slice(0, MAX_ROWS));
        });
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message);
      });
    return () => {
      cancelled = true;
      stop();
    };
  }, []);

  const groups = useMemo(() => groupErrors(rows ?? []), [rows]);

  const remove = async (row: ErrorRow) => {
    await deleteDoc(doc(db, 'errors', row.id));
    setRows((current) => (current ?? []).filter((r) => r.id !== row.id));
  };

  /** The errors past their `expireAt` (30 days): a TTL policy would do it by itself but needs Firebase billing. */
  const cleanExpired = async () => {
    setCleaning(true);
    try {
      const expired = await getDocs(query(collection(db, 'errors'), where('expireAt', '<', Timestamp.now()), limit(400)));
      const batch = writeBatch(db);
      expired.docs.forEach((snapshot) => batch.delete(snapshot.ref));
      await batch.commit();
      const gone = new Set(expired.docs.map((snapshot) => snapshot.id));
      setRows((current) => (current ?? []).filter((r) => !gone.has(r.id)));
    } finally {
      setCleaning(false);
    }
  };

  if (loadError) return <div className="empty">Impossible de charger les erreurs : {loadError}</div>;
  if (rows === null) return <div className="empty">Chargement…</div>;

  return (
    <>
      <div className="panel">
        <div className="row panel-header">
          <span className="field-label">Erreurs</span>
          <button className="reset" type="button" disabled={cleaning} onClick={cleanExpired}>
            {cleaning ? 'Nettoyage…' : 'Effacer celles de plus de 30 jours'}
          </button>
        </div>
      </div>

      <p className="count-line">
        <b>{rows.length}</b> erreur{rows.length === 1 ? '' : 's'} affichée{rows.length === 1 ? '' : 's'} · les nouvelles
        arrivent toutes seules
      </p>

      {rows.length === 0 ? (
        <div className="empty">Aucune erreur enregistrée.</div>
      ) : (
        <>
          <div className="place-card">
            <h3 className="game-title">Par action</h3>
            <table className="kv-table">
              <tbody>
                {groups.map((group) => (
                  <tr key={`${group.action}|${group.code}`}>
                    <th>{group.action}</th>
                    <td>
                      {group.code} · <b>{group.count}</b>
                      {group.repeats > 0 && ` (+${group.repeats} répétées)`} · dernière {formatDate(group.lastAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="place-card">
            <h3 className="game-title">Détail</h3>
            <table className="kv-table">
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <th>{formatDate(row.at)}</th>
                    <td>
                      <b>{row.action}</b> · {row.code}
                      {row.repeats > 0 && ` · +${row.repeats}`}
                      <br />
                      {row.message}
                      <br />
                      <span className="place-meta">
                        {row.kind === 'game' ? 'action de jeu' : 'tâche de fond'} · {row.platform} · v{row.version}
                        {row.room !== null && ` · room ${row.room}`}
                      </span>{' '}
                      <button className="reset" type="button" onClick={() => remove(row)}>
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};
