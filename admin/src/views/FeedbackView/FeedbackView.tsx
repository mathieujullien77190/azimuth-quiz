import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { DEV_FEEDBACK_COLLECTION } from '@/data';

import { db } from '../../firebase';

import { BATCH_SIZE } from './constants';
import { feedbackText } from './helpers';
import type { FeedbackRow } from './types';

const toRow = (snapshot: QueryDocumentSnapshot): FeedbackRow => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    game: data.game,
    targetKey: data.targetKey,
    name: data.name,
    currentDifficulty: data.currentDifficulty,
    suggestedDifficulty: data.suggestedDifficulty,
    at: (data.at as Timestamp | null)?.toMillis() ?? Date.now(),
  };
};

/**
 * Avis des joueurs sur la difficulte d'un lieu, en mode dev (`devFeedback`) : un texte en lecture seule de consignes
 * pour une IA qui edite les donnees, mis a jour en direct, un bouton "Copier" et "Nettoyer" qui supprime tout
 * (confirmation dans la page, un dialogue navigateur bloquerait). Lit Firestore directement, hors copie de donnees et
 * journal.
 */
export const FeedbackView = () => {
  const [rows, setRows] = useState<FeedbackRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, DEV_FEEDBACK_COLLECTION), orderBy('at', 'asc')),
      (snapshot) => setRows(snapshot.docs.map(toRow)),
      (error: Error) => setLoadError(error.message),
    );
  }, []);

  const text = useMemo(() => feedbackText(rows ?? []), [rows]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  /** Supprime tous les avis par 500 (plafond d'un lot) jusqu'a ce qu'il n'en reste plus. */
  const clean = async () => {
    setCleaning(true);
    try {
      for (;;) {
        const batch = writeBatch(db);
        const documents = await getDocs(query(collection(db, DEV_FEEDBACK_COLLECTION), limit(BATCH_SIZE)));
        if (documents.empty) break;
        documents.docs.forEach((snapshot) => batch.delete(doc(db, DEV_FEEDBACK_COLLECTION, snapshot.id)));
        await batch.commit();
      }
    } finally {
      setCleaning(false);
      setConfirming(false);
    }
  };

  if (loadError) return <div className="empty">Impossible de charger les avis : {loadError}</div>;
  if (rows === null) return <div className="empty">Chargement…</div>;

  return (
    <>
      <div className="panel">
        <div className="row panel-header">
          <span className="field-label">Avis de difficulté (mode dev)</span>
          <button className="reset" type="button" onClick={copy}>
            {copied ? 'Copié' : 'Copier'}
          </button>
          {confirming ? (
            <>
              <button className="reset" type="button" disabled={cleaning} onClick={clean}>
                {cleaning ? 'Nettoyage…' : `Confirmer (supprime ${rows.length})`}
              </button>
              <button className="reset" type="button" disabled={cleaning} onClick={() => setConfirming(false)}>
                Annuler
              </button>
            </>
          ) : (
            <button className="reset" type="button" disabled={rows.length === 0} onClick={() => setConfirming(true)}>
              Nettoyer
            </button>
          )}
        </div>
      </div>

      <p className="count-line">
        <b>{rows.length}</b> avis · les nouveaux arrivent tout seuls
      </p>

      <textarea aria-label="Avis de difficulté" className="feedback-text" readOnly value={text} />
    </>
  );
};
