# Design (theme)

Deux themes : `night` (bleu nuit + ambre, ciel étoilé — la maquette `designs/night.svg`,
réponse en jaune) et `day` (ciel bleu + ambre, nuages qui dérivent). Choisi dans
`SettingsScreen`, persisté (`ThemeProvider`), `useTheme()` retourne le theme courant.

## Utiliser le theme dans un composant

```tsx
import { useThemedStyles } from '@/themes';
import type { Theme } from '@/types';

const createStyles = ({ colors, radius, typography }: Theme) =>
  StyleSheet.create({ box: { backgroundColor: colors.surface, borderRadius: radius.md } });

const Box = () => {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.box} />;
};
```
