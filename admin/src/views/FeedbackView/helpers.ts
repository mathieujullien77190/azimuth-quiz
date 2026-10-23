import { DIFFICULTY_ORDER } from './constants';
import type { FeedbackRow, FeedbackTarget } from './types';

/** Compte les avis par lieu (le plus recent donne la difficulte des donnees), cibles les plus votees d'abord. */
export const groupFeedback = (rows: FeedbackRow[]): FeedbackTarget[] => {
  const byTarget = new Map<string, FeedbackTarget & { lastAt: number }>();
  for (const row of rows) {
    const key = row.targetKey;
    const target = byTarget.get(key) ?? {
      targetKey: row.targetKey,
      name: row.name,
      currentDifficulty: row.currentDifficulty,
      votes: { easy: 0, intermediate: 0, hard: 0 },
      total: 0,
      winners: [],
      lastAt: -1,
    };
    target.votes[row.suggestedDifficulty] += 1;
    target.total += 1;
    if (row.at >= target.lastAt) {
      target.lastAt = row.at;
      target.name = row.name;
      target.currentDifficulty = row.currentDifficulty;
    }
    byTarget.set(key, target);
  }
  return [...byTarget.values()]
    .map(({ lastAt: _lastAt, ...target }) => {
      const most = Math.max(...DIFFICULTY_ORDER.map((difficulty) => target.votes[difficulty]));
      return { ...target, winners: DIFFICULTY_ORDER.filter((difficulty) => target.votes[difficulty] === most) };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'fr'));
};

const votesWord = (count: number): string => (count === 1 ? 'vote' : 'votes');

const subject = (target: FeedbackTarget): string =>
  `du lieu « ${target.name} » (${target.targetKey})`;

/** "3 votes : 1 easy, 0 intermediate, 2 hard" */
const tally = (target: FeedbackTarget): string =>
  `${target.total} ${votesWord(target.total)} : ${DIFFICULTY_ORDER.map((difficulty) => `${target.votes[difficulty]} ${difficulty}`).join(', ')}`;

/** Les donnees disent-elles deja ce que disent les joueurs (une egalite qui les inclut compte comme juste) ? */
export const isAlreadyRight = (target: FeedbackTarget): boolean => target.winners.includes(target.currentDifficulty);

/** Consigne d'une ligne pour une cible dont la difficulte doit changer, ecrite pour une IA qui edite les donnees. */
export const directiveFor = (target: FeedbackTarget): string => {
  const wanted = target.winners.join(' ou ');
  const tie = target.winners.length > 1 ? 'égalité, à toi de trancher ; ' : '';
  return `Change la difficulté ${subject(target)} de ${target.currentDifficulty} à ${wanted} (${tie}${tally(target)}).`;
};

const ALREADY_RIGHT_TITLE = 'Déjà corrects (rien à changer) :';

/**
 * Toute la liste d'avis en texte pour la zone en lecture seule : d'abord les consignes (une ligne par lieu a
 * changer), puis, a part, ceux ou les joueurs sont d'accord avec les donnees.
 */
export const feedbackText = (rows: FeedbackRow[]): string => {
  const targets = groupFeedback(rows);
  if (targets.length === 0) return 'Aucun avis pour le moment.';
  const changes = targets.filter((target) => !isAlreadyRight(target)).map(directiveFor);
  const fine = targets
    .filter(isAlreadyRight)
    .map((target) => `- ${target.name} (${target.targetKey}) reste ${target.currentDifficulty} (${tally(target)}).`);
  return [
    ...(changes.length > 0 ? changes : ['Aucun changement demandé.']),
    ...(fine.length > 0 ? ['', ALREADY_RIGHT_TITLE, ...fine] : []),
  ].join('\n');
};
