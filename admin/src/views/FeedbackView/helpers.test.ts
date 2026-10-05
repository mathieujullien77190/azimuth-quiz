import { describe, expect, it } from 'vitest';

import { directiveFor, feedbackText, groupFeedback, isAlreadyRight } from './helpers';
import type { FeedbackRow } from './types';

let nextId = 0;
const row = (over: Partial<FeedbackRow> = {}): FeedbackRow => ({
  id: `r${nextId++}`,
  game: 'compass',
  targetKey: 'vic',
  name: 'Chutes Victoria',
  currentDifficulty: 'intermediate',
  suggestedDifficulty: 'hard',
  at: 1000,
  ...over,
});

describe('groupFeedback', () => {
  it('counts the votes per place, with the winners', () => {
    const [victoria] = groupFeedback([
      row({ suggestedDifficulty: 'hard' }),
      row({ suggestedDifficulty: 'hard' }),
      row({ suggestedDifficulty: 'easy' }),
    ]);
    expect(victoria).toMatchObject({
      targetKey: 'vic',
      total: 3,
      votes: { easy: 1, intermediate: 0, hard: 2 },
      winners: ['hard'],
    });
  });

  it('takes the name and the data difficulty from the newest opinion', () => {
    const [target] = groupFeedback([
      row({ at: 2000, name: 'Nouveau nom', currentDifficulty: 'hard' }),
      row({ at: 1000, name: 'Ancien nom', currentDifficulty: 'easy' }),
    ]);
    expect(target).toMatchObject({ name: 'Nouveau nom', currentDifficulty: 'hard' });
  });

  it('lists every difficulty on a tie, and the most voted targets first (then by name)', () => {
    const targets = groupFeedback([
      row({ targetKey: 'a', name: 'Beta', suggestedDifficulty: 'easy' }),
      row({ targetKey: 'a', name: 'Beta', suggestedDifficulty: 'hard' }),
      row({ targetKey: 'b', name: 'Alpha' }),
      row({ targetKey: 'c', name: 'Zeta' }),
      row({ targetKey: 'c', name: 'Zeta' }),
      row({ targetKey: 'c', name: 'Zeta' }),
    ]);
    expect(targets.map((target) => target.targetKey)).toEqual(['c', 'a', 'b']);
    expect(targets[1].winners).toEqual(['easy', 'hard']);
  });

  it('puts equally voted targets in name order', () => {
    const targets = groupFeedback([row({ targetKey: 'z', name: 'Zeta' }), row({ targetKey: 'a', name: 'Alpha' })]);
    expect(targets.map((target) => target.name)).toEqual(['Alpha', 'Zeta']);
  });
});

describe('isAlreadyRight', () => {
  it('is true when the data difficulty is among the winners, tie included', () => {
    const [agreed] = groupFeedback([row({ suggestedDifficulty: 'intermediate' })]);
    expect(isAlreadyRight(agreed)).toBe(true);
    const [tied] = groupFeedback([row({ suggestedDifficulty: 'intermediate' }), row({ suggestedDifficulty: 'hard' })]);
    expect(isAlreadyRight(tied)).toBe(true);
    const [other] = groupFeedback([row({ suggestedDifficulty: 'hard' })]);
    expect(isAlreadyRight(other)).toBe(false);
  });
});

describe('directiveFor', () => {
  it('words the change for a place', () => {
    const [target] = groupFeedback([
      row({ suggestedDifficulty: 'hard' }),
      row({ suggestedDifficulty: 'hard' }),
      row({ suggestedDifficulty: 'easy' }),
    ]);
    expect(directiveFor(target)).toBe(
      'Change la difficulté du lieu « Chutes Victoria » (vic) de intermediate à hard (3 votes : 1 easy, 0 intermediate, 2 hard).',
    );
  });

  it('words a single vote in the singular', () => {
    const [target] = groupFeedback([row({ currentDifficulty: 'easy', suggestedDifficulty: 'hard' })]);
    expect(directiveFor(target)).toBe(
      'Change la difficulté du lieu « Chutes Victoria » (vic) de easy à hard (1 vote : 0 easy, 0 intermediate, 1 hard).',
    );
  });

  it('offers both on a tie that does not include the data difficulty', () => {
    const [target] = groupFeedback([row({ suggestedDifficulty: 'easy' }), row({ suggestedDifficulty: 'hard' })]);
    expect(directiveFor({ ...target, currentDifficulty: 'intermediate' })).toBe(
      'Change la difficulté du lieu « Chutes Victoria » (vic) de intermediate à easy ou hard (égalité, à toi de trancher ; 2 votes : 1 easy, 0 intermediate, 1 hard).',
    );
  });
});

describe('feedbackText', () => {
  it('says so when there is no opinion', () => {
    expect(feedbackText([])).toBe('Aucun avis pour le moment.');
  });

  it('gives the directives first, then the ones already right', () => {
    const text = feedbackText([
      row({ suggestedDifficulty: 'hard' }),
      row({ targetKey: 'par', name: 'Paris', currentDifficulty: 'easy', suggestedDifficulty: 'easy' }),
    ]);
    expect(text.split('\n')).toEqual([
      'Change la difficulté du lieu « Chutes Victoria » (vic) de intermediate à hard (1 vote : 0 easy, 0 intermediate, 1 hard).',
      '',
      'Déjà corrects (rien à changer) :',
      '- Paris (par) reste easy (1 vote : 1 easy, 0 intermediate, 0 hard).',
    ]);
  });

  it('says nothing is asked when everything is already right', () => {
    const text = feedbackText([row({ suggestedDifficulty: 'intermediate' })]);
    expect(text.split('\n')[0]).toBe('Aucun changement demandé.');
  });

  it('has no "already right" section when every target changes', () => {
    expect(feedbackText([row()])).not.toContain('Déjà corrects');
  });
});
