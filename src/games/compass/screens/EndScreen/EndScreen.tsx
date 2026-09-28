import FinalStandings from '@/components/FinalStandings';
import type { RecapCell, RoundsRecap } from '@/components/FinalStandings';
import { getRank } from '@/helpers';
import { useTranslation } from '@/i18n';

import { maxTotalScore, roundBest } from './helpers';
import type { RoundBest } from './helpers';
import type { EndScreenProps } from './types';

/** How a round's best player shows in the recap: their name and points, or just the points when alone. */
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
 * Compass' end of game: the shared `FinalStandings` (scores, medals, winner) fed with this game's
 * own extras — the rank title when playing alone, and the round-by-round recap of who was best at the
 * heading and at the distance.
 */
export const EndScreen = ({ players, records, totals, onMenu }: EndScreenProps) => {
  const t = useTranslation();
  const alone = players.length === 1;

  const recap: RoundsRecap = {
    title: t.endScreen.recapTitle,
    columns: [t.roundResult.direction, t.roundResult.distance],
    rows: records.map((record) => ({
      label: record.place.name,
      cells: [
        bestCell(roundBest(record, players, 'directionPoints'), alone),
        bestCell(roundBest(record, players, 'distancePoints'), alone),
      ],
    })),
  };

  return (
    <FinalStandings
      entries={players.map((player, index) => ({ name: player.name, total: totals[index] ?? 0, color: player.color }))}
      hero={alone ? getRank(totals[0] ?? 0, maxTotalScore(records), t.endScreen.ranks) : undefined}
      homeLabel={t.endScreen.menu}
      onHome={onMenu}
      recap={recap}
      title={t.endScreen.title}
    />
  );
};
