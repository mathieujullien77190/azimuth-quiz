# Design (theme)

Un seul design, la maquette `designs/night.svg` : bleu nuit + ambre, ciel étoilé,
réponse en jaune.

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
