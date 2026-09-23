import type { Place } from "@/types";

import { placeFactory, tier } from "./helpers";

const kid = placeFactory("kids");
// Categorie deja pensee "facile" par nature (lieux tres reconnaissables pour des enfants) :
// une seule difficulte, pas de repartition en paliers.
const easy = tier("easy");

export const KIDS: Place[] = easy([
  // Europe
  kid(
    "Tour Eiffel",
    "France",
    "FR",
    48.8584,
    2.2945,
    "En été, elle grandit d’environ 15 cm : la chaleur dilate son armature en fer !",
  ),
  kid(
    "Notre-Dame de Paris",
    "France",
    "FR",
    48.853,
    2.3499,
    "Sa flèche s’est effondrée dans les flammes le 15 avril 2019 ; la cathédrale a rouvert ses portes en décembre 2024 après cinq ans de travaux.",
  ),
  kid(
    "Big Ben",
    "Royaume-Uni",
    "GB",
    51.5007,
    -0.1246,
    "« Big Ben » est en réalité le nom de la grosse cloche, pas de la tour ; elle s’est fissurée deux mois seulement après son installation en 1859.",
  ),
  kid(
    "Stonehenge",
    "Royaume-Uni",
    "GB",
    51.1789,
    -1.8262,
    "Certaines de ses pierres viennent du pays de Galles, à plus de 200 km de là — un sacré voyage il y a environ 4 500 ans, sans camion ni grue !",
  ),
  kid(
    "Colisée",
    "Italie",
    "IT",
    41.8902,
    12.4922,
    "Sous l’arène se cachait un réseau secret de couloirs et d’ascenseurs actionnés à bras d’homme, pour faire surgir animaux et gladiateurs en plein combat.",
  ),
  kid(
    "Tour de Pise",
    "Italie",
    "IT",
    43.723,
    10.3966,
    "Elle penche depuis le début de sa construction en 1173 à cause d’un sol trop mou ; des travaux menés entre 1993 et 2001 ont réduit son inclinaison sans jamais la redresser complètement.",
  ),
  kid(
    "Kremlin et place Rouge",
    "Russie",
    "RU",
    55.7539,
    37.6208,
    "Le nom de la place Rouge n’a rien à voir avec le communisme : en vieux russe, « krasnaïa » voulait aussi dire « belle ».",
  ),
  kid(
    "Acropole d’Athènes",
    "Grèce",
    "GR",
    37.9715,
    23.7257,
    "Le Parthénon a explosé en partie le 26 septembre 1687 : les Ottomans y stockaient de la poudre à canon, touchée par un boulet vénitien.",
  ),

  // Afrique
  kid(
    "Pyramides de Gizeh",
    "Égypte",
    "EG",
    29.9792,
    31.1342,
    "La grande pyramide de Khéops est restée la construction la plus haute du monde pendant environ 3 800 ans !",
  ),
  kid(
    "Grand Sphinx de Gizeh",
    "Égypte",
    "EG",
    29.9753,
    31.1376,
    "Taillé dans un seul énorme bloc de calcaire, il mesure environ 73 m de long — et personne ne sait avec certitude comment il a perdu le bout de son nez.",
  ),

  // Asie
  kid(
    "Grande Muraille de Chine",
    "Chine",
    "CN",
    40.3599,
    116.0204,
    "Contrairement à une légende très répandue, elle n’est pas visible à l’œil nu depuis l’espace ; elle s’étend tout de même sur plus de 21 000 km au total.",
  ),
  kid(
    "Taj Mahal",
    "Inde",
    "IN",
    27.1751,
    78.0421,
    "Il a fallu environ 20 000 ouvriers et artisans pour le construire, entre 1632 et 1648, sur ordre de l’empereur Shah Jahan en mémoire de son épouse.",
  ),
  kid(
    "Mont Fuji",
    "Japon",
    "JP",
    35.3606,
    138.7274,
    "C’est un volcan encore actif : sa dernière éruption, en 1707, a saupoudré Tokyo, à une centaine de kilomètres de là, d’une fine couche de cendres.",
  ),
  kid(
    "Mont Everest",
    "Népal",
    "NP",
    27.9881,
    86.925,
    "Il grandit encore aujourd’hui, d’environ 4 mm par an, poussé par la lente collision entre deux plaques tectoniques.",
  ),
  kid(
    "Burj Khalifa",
    "Émirats arabes unis",
    "AE",
    25.1972,
    55.2744,
    "Avec ses 828 m de haut, c’est le plus haut gratte-ciel du monde depuis son inauguration en 2010 — il faut vraiment lever la tête pour voir son sommet !",
  ),

  // Océanie
  kid(
    "Opéra de Sydney",
    "Australie",
    "AU",
    -33.8568,
    151.2153,
    "Ses toits en forme de coquillages sont recouverts d’environ un million de tuiles en céramique blanche et crème, fabriquées en Suède.",
  ),

  // Amérique du Nord
  kid(
    "Statue de la Liberté",
    "États-Unis",
    "US",
    40.6892,
    -74.0445,
    "Sa peau de cuivre ne fait qu’environ 2,4 mm d’épaisseur, à peine plus que deux pièces de monnaie empilées.",
  ),
  kid(
    "Golden Gate Bridge",
    "États-Unis",
    "US",
    37.8199,
    -122.4783,
    "Sa couleur orange si reconnaissable porte un nom officiel, « orange international », choisi pour qu’il reste bien visible dans le brouillard de San Francisco.",
  ),
  kid(
    "Chutes du Niagara",
    "Canada",
    "CA",
    43.0962,
    -79.0377,
    "En 1901, une institutrice de 63 ans, Annie Edson Taylor, a été la première personne à survivre à leur chute — enfermée dans un tonneau !",
  ),

  // Amérique du Sud
  kid(
    "Machu Picchu",
    "Pérou",
    "PE",
    -13.1631,
    -72.545,
    "Ses énormes pierres s’emboîtent si parfaitement, sans aucun mortier, qu’on n’arrive même pas à glisser une lame de couteau entre elles.",
  ),
]);
