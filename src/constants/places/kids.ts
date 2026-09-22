import type { Place } from "@/types";

import { placeFactory, tier } from "./helpers";

const kid = placeFactory("kids");
// Categorie deja pensee "facile" par nature (lieux tres reconnaissables pour des enfants) :
// une seule difficulte, pas de repartition en paliers.
const easy = tier("easy");

export const KIDS: Place[] = easy([
  // Europe
  kid("Tour Eiffel", "France", "FR", 48.8584, 2.2945),
  kid("Notre-Dame de Paris", "France", "FR", 48.853, 2.3499),
  kid("Big Ben", "Royaume-Uni", "GB", 51.5007, -0.1246),
  kid("Stonehenge", "Royaume-Uni", "GB", 51.1789, -1.8262),
  kid("Colisée", "Italie", "IT", 41.8902, 12.4922),
  kid("Tour de Pise", "Italie", "IT", 43.723, 10.3966),
  kid("Kremlin et place Rouge", "Russie", "RU", 55.7539, 37.6208),
  kid("Acropole d’Athènes", "Grèce", "GR", 37.9715, 23.7257),

  // Afrique
  kid("Pyramides de Gizeh", "Égypte", "EG", 29.9792, 31.1342),
  kid("Grand Sphinx de Gizeh", "Égypte", "EG", 29.9753, 31.1376),

  // Asie
  kid("Grande Muraille de Chine", "Chine", "CN", 40.3599, 116.0204),
  kid("Taj Mahal", "Inde", "IN", 27.1751, 78.0421),
  kid("Mont Fuji", "Japon", "JP", 35.3606, 138.7274),
  kid("Mont Everest", "Népal", "NP", 27.9881, 86.925),
  kid("Burj Khalifa", "Émirats arabes unis", "AE", 25.1972, 55.2744),

  // Océanie
  kid("Opéra de Sydney", "Australie", "AU", -33.8568, 151.2153),

  // Amérique du Nord
  kid("Statue de la Liberté", "États-Unis", "US", 40.6892, -74.0445),
  kid("Golden Gate Bridge", "États-Unis", "US", 37.8199, -122.4783),
  kid("Chutes du Niagara", "Canada", "CA", 43.0962, -79.0377),

  // Amérique du Sud
  kid("Machu Picchu", "Pérou", "PE", -13.1631, -72.545),
]);
