import { Text, View } from 'react-native';

import { formatNumber } from '@/helpers';
import { useTranslation } from '@/i18n';
import { useThemedStyles } from '@/themes';

import PlayerTabs from '@/components/PlayerTabs';
import DifficultyBadge from '@/components/DifficultyBadge';
import RoundCounter from '@/components/RoundCounter';
import QuitButton from '@/components/ui/QuitButton';
import type { GameHeaderProps } from './types';

import { createStyles } from './styles';

/**
 * En-tete de manche commun aux jeux (dumb). Ligne du haut : croix de sortie et code de la room a gauche, nom et
 * points de cet appareil a droite. Dessous : "Manche 3 / 10 · difficulte" (`RoundCounter`, `DifficultyBadge`),
 * les onglets joueurs si `players` est donne et, en mode voyage, la ligne `location`.
 */
export const GameHeader = ({
  onQuit,
  code,
  name,
  points,
  roundNumber,
  totalRounds,
  difficulty,
  players,
  turnIndex = -1,
  location,
}: GameHeaderProps) => {
  const styles = useThemedStyles(createStyles);
  const t = useTranslation();

  return (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <View style={styles.left}>
          <QuitButton onPress={onQuit} />
          <Text style={styles.code}>{code.toUpperCase()}</Text>
        </View>
        <Text style={styles.score}>
          {name} · {formatNumber(points)} {t.common.pts}
        </Text>
      </View>
      <View style={styles.progress}>
        <RoundCounter roundNumber={roundNumber} totalRounds={totalRounds} />
        <Text style={styles.separator}>·</Text>
        <DifficultyBadge difficulty={difficulty} />
      </View>
      {location !== undefined && <Text style={styles.location}>{location}</Text>}
      {players !== undefined && (
        <PlayerTabs
          activeIndex={turnIndex}
          activeLabel={t.game.playerTurn}
          order={players.map((_, index) => index)}
          players={players}
        />
      )}
    </View>
  );
};
