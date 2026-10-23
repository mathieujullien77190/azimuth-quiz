import FinalStandings from '@/components/FinalStandings';
import RoundsRecap from '@/games/compass/components/RoundsRecap';
import type { RecapCell } from '@/games/compass/components/RoundsRecap';
import { useTranslation } from '@/i18n';

import { roundBest } from './helpers';
import type { RoundBest } from './helpers';
import type { EndScreenProps } from './types';

/** Meilleur d'une manche dans le recap : nom et points, ou les points seuls en solo. */
const bestCell = (best: RoundBest | null, alone: boolean): RecapCell => {
  if (best === null) return { text: '–' };
  if (alone) return { text: `+${best.points}` };
  return {
    text: best.players.map((player) => player.name).join(', '),
    detail: `+${best.points}`,
    color: best.players.length === 1 ? best.players[0].color : undefined,
  };
};

/**
 * Fin de partie Compass : `FinalStandings` commun, puis le recap par manche du meilleur au cap et a la
 * distance, et les boutons rejouer/quitter.
 */
export const EndScreen = ({ players, records, totals, localName, onReplay, onQuit }: EndScreenProps) => {
  const t = useTranslation();
  const alone = players.length === 1;

  return (
    <FinalStandings
      entries={players.map((player, index) => ({ name: player.name, total: totals[index] ?? 0, color: player.color }))}
      localName={localName}
      onQuit={onQuit}
      onReplay={onReplay}
      title={t.endScreen.title}
    >
      <RoundsRecap
        columns={[t.roundResult.direction, t.roundResult.distance]}
        rows={records.map((record) => ({
          label: record.place.name,
          cells: [
            bestCell(roundBest(record, players, 'directionPoints'), alone),
            bestCell(roundBest(record, players, 'distancePoints'), alone),
          ],
        }))}
        title={t.endScreen.recapTitle}
      />
    </FinalStandings>
  );
};
