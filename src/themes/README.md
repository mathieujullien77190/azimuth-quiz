# Designs (themes)

Deux designs, choisis parmi les maquettes du dossier `designs/` :

| Fichier    | Nom   | Mode   | Ambiance                               |
| ---------- | ----- | ------ | -------------------------------------- |
| `night.ts` | Nuit  | sombre | Bleu nuit + ambre, ciel etoile, reponse en jaune |
| `paper.ts` | Papier| clair  | Minimal, quadrillage, accent et reponse dans le meme bleu marine  |

Le mode se choisit dans « Nouvelle partie > Options > Apparence » : **Auto** (suit le telephone),
**Clair** (Papier) ou **Sombre** (Nuit). Le choix est memorise.

## Utiliser un theme dans un composant

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
