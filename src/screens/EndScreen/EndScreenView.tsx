import FinalStandings from '@/components/game/FinalStandings';
import RoundsRecap from '@/components/game/RoundsRecap';

import type { EndScreenViewProps } from './types';

/** Pur rendu : le classement final commun, puis le recap par manche dessous. */
export const EndScreenView = ({
  title,
  entries,
  localName,
  recapTitle,
  columns,
  rows,
  onReplay,
  onQuit,
}: EndScreenViewProps) => (
  <FinalStandings entries={entries} localName={localName} onQuit={onQuit} onReplay={onReplay} title={title}>
    <RoundsRecap columns={columns} rows={rows} title={recapTitle} />
  </FinalStandings>
);
