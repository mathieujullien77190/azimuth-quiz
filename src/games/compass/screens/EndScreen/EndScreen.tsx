import FinalStandings from '@/components/FinalStandings';
import Button from '@/components/ui/Button';
import RoundsRecap from '@/games/compass/components/RoundsRecap';
import type { RecapCell } from '@/games/compass/components/RoundsRecap';
import { useTranslation } from '@/i18n';

import { roundBest } from './helpers';
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
 * Compass' end of game: the shared `FinalStandings` (scores, medals, winner) with this game's own extras
 * under it — the round-by-round recap of who was best at the heading and at the distance (the points won
 * when playing alone), and the button that leaves the game.
 */
export const EndScreen = ({ players, records, totals, localName, onMenu }: EndScreenProps) => {
  const t = useTranslation();
  const alone = players.length === 1;

  return (
    <FinalStandings
      entries={players.map((player, index) => ({ name: player.name, total: totals[index] ?? 0, color: player.color }))}
      localName={localName}
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
      <Button label={t.endScreen.menu} onPress={onMenu} />
    </FinalStandings>
  );
};
