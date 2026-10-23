# components/

Composants reutilisables, ranges par role. Un composant = un dossier `index.ts` + `<Name>.tsx` + `helpers.ts` + `constants.ts` +
`types.ts` + `styles.ts` (+ `__tests__/` et `doc/`). Les ecrans sont dans `screens/`.

| Dossier | Contenu |
|---|---|
| `ui/` | primitives : Button, Card, Chip, MiniButton, QuitButton, Screen, Section, SliderTrack, Spinner, Toggle, DifficultyBadge, RoundCounter, VersionLine, NoticeOverlay, ColorPalette |
| `providers/` | ThemeProvider, LanguageProvider, StartupSplash (chargement de depart), ErrorNoticeHost |
| `home/` | AppTitle, LoadingBar, SwayingCompass, MascotButton (+ GearIcon, UfoButton, HelicopterButton) |
| `geo/` | Compass (cadran qu'on regle), Globe3D, EarthSection |
| `game/` | GameHeader, GameFooter, FooterNav, PlaceCard, RoundResult, RoundsRecap, FinalStandings, ReactionBar, ReactionOverlay |
| `setup/` | preparation de partie : SetupScreenShell, PartySection, CategorySection, DifficultySection, RoundsSection, OptionsSection, hook `useSetupRoom` |

## Smart / dumb

Un composant est **dumb** : props et callbacks deja decides, `useTranslation`, `useTheme`, `useThemedStyles`, `useWindowDimensions`
et un etat d'animation local sont permis, mais jamais d'effet metier, de store ni de routeur. Les composants **smart** de ce
dossier sont `providers/*`, `ui/ColorPalette` (page de doc) et le hook `setup/useSetupRoom` (store, routeur, Firestore). Un
composant dumb a une story ; un smart n'en a pas (liste `NO_STORY_OK` du script d'audit de `quality-check`).

## Styles et theme

- `useThemedStyles(createStyles)` est le pattern ; `createStyles` vit dans `styles.ts` et ne contient aucune logique.
- Deux themes, `night` et `day`, fond uni, choix persiste (`ThemeProvider`, cle `azimuthquiz:theme`). Police unique `FONT_FAMILY` ;
  un composant SVG lit `typography.<token>.fontFamily` et la passe a `<SvgText>`.
- **`Screen`** : `header` et `footer` sont hors du `ScrollView`. Piege : un `ScrollView` horizontal dans un `header` s'etire en
  hauteur sur react-native-web sans `style={{ flexGrow: 0, flexShrink: 0 }}`.

## Boussole d'accueil (`home/SwayingCompass`)

Le cadran dessine une aiguille qui se balance (sinusoide amortie, courbe continue animee en un seul mouvement lineaire natif),
puis, apres un nombre aleatoire de sens et sur un sommet du balancier (aiguille a l'arret, ecart deja petit), fait 2 a 4 tours
rapides et repart du sommet haut sans saut ; le cycle se repete. L'aleatoire est injectable (`random`). Reglages : `constants.ts`
(`SWAY_*`, `SPIN_*`).

## Globe3D (`geo/Globe3D/`)

Vraie boule **three.js** sur surface OpenGL `expo-gl`, montree d'abord quand l'appelant donne `origin` (bouton 2D/3D), rotation au
doigt, zoom a deux doigts ou +/− (`MAX_ZOOM` = 14), bouton « N » pour recentrer.

- Gestes mesures sur la **position absolue** des doigts (`Fingers`), jamais sur le cumul d'un geste ; le geste reste au globe
  (`onShouldBlockNativeResponder`, `touchAction: 'none'`).
- `scene.ts` construit la scene ; `useGlobeRenderer.ts` dessine **a la demande** (pas en boucle), camera orthographique, nord en
  haut ; `renderer.ts` (isole pour les tests) branche `WebGLRenderer` sur `expo-gl` (faux canvas sur mobile, vrai sur le web).
- Decor : `globeLand.ts` (Natural Earth 50 m sans Antarctique, en un seul `LineSegments`) et `globeMask.ts` (masque terre/mer
  2048x1024, RLE base 36), generes par `node scripts/globe-land.mjs` (`--dry` donne les poids). `landFill` pose le masque sur une
  coque a part.
- **Piege des altitudes** : une sphere a facettes creuse sous son rayon (`1 - cos(180 / segments)`) ; la coque peinte
  (`LAND_FILL_SEGMENTS`, `LAND_FILL_ALTITUDE`) doit depasser ce creux et le trait de cote doit depasser la coque ; un test le verifie.
- Chaque reponse est un trajet a cap constant en tube (`rhumbDestination` / `routePoints`), la vraie reponse aussi (jaune,
  `colors.truth`). `buildRoutes` reconstruit les tubes au zoom (`ROUTE_THICKNESS / zoom`) ; les pastilles se remettent a taille
  d'ecran (`markScale`). Pole nord, satellite de nuit sur l'**equateur** (`orbitPoint`), libelles en vues par-dessus la surface
  (`screenPoint`).
- `three` est **ESM seulement** : `transformIgnorePatterns` de Jest (`package.json`) l'autorise ; la liste est recopiee de
  `jest-expo` et se recopie si le preset change a une montee de SDK.

## Reactions (`game/ReactionBar`, `game/ReactionOverlay`)

`ReactionBar` : bouton 😀 en `position: absolute; bottom: '100%'` dans `GameFooter`, colonne d'emojis (`REACTION_EMOJIS`) qui reste
ouverte jusqu'au clic du bouton. `ReactionOverlay` affiche la bulle montante (2,5 s + nom de l'envoyeur) chez tous les joueurs.
Cote donnees : voir `firebase/CLAUDE.md`.
