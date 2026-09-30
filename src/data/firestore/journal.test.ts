import { collapseJournal } from './journal';

describe('collapseJournal', () => {
  it('keeps each document once, with its last operation', () => {
    expect(
      collapseJournal([
        [
          { c: 'places', id: 'par', op: 'set' },
          { c: 'places', id: 'rom', op: 'set' },
        ],
        [
          { c: 'places', id: 'par', op: 'delete' },
          { c: 'countries', id: 'FR', op: 'set' },
        ],
        [{ c: 'places', id: 'rom', op: 'set' }],
      ]),
    ).toEqual([
      { c: 'places', id: 'par', op: 'delete' },
      { c: 'places', id: 'rom', op: 'set' },
      { c: 'countries', id: 'FR', op: 'set' },
    ]);
  });

  it('keeps ids apart per collection and handles no entry at all', () => {
    expect(
      collapseJournal([[{ c: 'places', id: 'fr', op: 'set' }], [{ c: 'countries', id: 'fr', op: 'set' }]]),
    ).toHaveLength(2);
    expect(collapseJournal([])).toEqual([]);
  });
});
