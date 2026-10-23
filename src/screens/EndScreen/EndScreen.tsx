import { useTranslation } from '@/i18n';

import { EndScreenView } from './EndScreenView';
import { bestCell, roundBest } from './helpers';
import type { EndScreenProps } from './types';

/**
 * Fin de partie Compass : `FinalStandings` commun, puis le recap par manche du meilleur au cap et a la
 * distance, et les boutons rejouer/quitter.
 */
export const EndScreen = ({ players, records, totals, localName, onReplay, onQuit }: EndScreenProps) => {
  const t = useTranslation();
  const alone = players.length === 1;

  return (
    <EndScreenView
      columns={[t.roundResult.direction, t.roundResult.distance]}
      entries={players.map((player, index) => ({ name: player.name, total: totals[index] ?? 0, color: player.color }))}
      localName={localName}
      onQuit={onQuit}
      onReplay={onReplay}
      recapTitle={t.endScreen.recapTitle}
      rows={records.map((record) => ({
        label: record.place.name,
        cells: [
          bestCell(roundBest(record, players, 'directionPoints'), alone),
          bestCell(roundBest(record, players, 'distancePoints'), alone),
        ],
      }))}
      title={t.endScreen.title}
    />
  );
};
