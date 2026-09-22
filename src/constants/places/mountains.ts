import type { Place } from '@/types';

import { placeFactory } from './helpers';

const mountain = placeFactory('mountains');

export const MOUNTAINS: Place[] = [
  // France
  mountain('Mont Blanc', 'France', 'FR', 45.8326, 6.8652),
  mountain('Puy de Dôme', 'France', 'FR', 45.7722, 2.964),
  mountain('Mont Ventoux', 'France', 'FR', 44.174, 5.2789),
  mountain('Pic du Midi de Bigorre', 'France', 'FR', 42.9369, 0.1425),
  mountain('Ballon d’Alsace', 'France', 'FR', 47.8203, 6.8412),
  mountain('Puy de Sancy', 'France', 'FR', 45.5286, 2.8143),
  mountain('Aiguille du Midi', 'France', 'FR', 45.8787, 6.8875),
  mountain('Vignemale', 'France', 'FR', 42.7719, -0.1447),
  mountain('La Meije', 'France', 'FR', 45.0044, 6.3061),
  mountain('Canigou', 'France', 'FR', 42.5187, 2.4569),
  mountain('Monte Cinto', 'France', 'FR', 42.3803, 8.9486),
  mountain('Barre des Écrins', 'France', 'FR', 44.9219, 6.3597),
  mountain('Grand Ballon', 'France', 'FR', 47.9006, 7.1017),
  mountain('Mont Aigoual', 'France', 'FR', 44.1214, 3.5811),

  // Monde
  mountain('Everest', 'Népal', 'NP', 27.9881, 86.925),
  mountain('K2', 'Pakistan', 'PK', 35.8825, 76.5133),
  mountain('Kangchenjunga', 'Népal', 'NP', 27.7025, 88.1475),
  mountain('Annapurna', 'Népal', 'NP', 28.5961, 83.8203),
  mountain('Kilimandjaro', 'Tanzanie', 'TZ', -3.0674, 37.3556),
  mountain('Mont Kenya', 'Kenya', 'KE', -0.1521, 37.3084),
  mountain('Elbrouz', 'Russie', 'RU', 43.3499, 42.4453),
  mountain('Denali', 'États-Unis', 'US', 63.0692, -151.007),
  mountain('Aconcagua', 'Argentine', 'AR', -32.6532, -70.0109),
  mountain('Mont Fuji', 'Japon', 'JP', 35.3606, 138.7274),
  mountain('Cervin', 'Suisse', 'CH', 45.9763, 7.6586),
  mountain('Jungfrau', 'Suisse', 'CH', 46.5368, 7.9626),
  mountain('Monte Rosa', 'Italie', 'IT', 45.9369, 7.8668),
  mountain('Vésuve', 'Italie', 'IT', 40.8224, 14.4289),
  mountain('Etna', 'Italie', 'IT', 37.751, 14.9934),
  mountain('Olympe', 'Grèce', 'GR', 40.0859, 22.3583),
  mountain('Grossglockner', 'Autriche', 'AT', 47.0742, 12.6939),
  mountain('Zugspitze', 'Allemagne', 'DE', 47.4211, 10.9853),
  mountain('Ben Nevis', 'Royaume-Uni', 'GB', 56.7969, -5.0036),
  mountain('Galdhøpiggen', 'Norvège', 'NO', 61.6365, 8.3125),
  mountain('Mulhacén', 'Espagne', 'ES', 37.0535, -3.3116),
  mountain('Mont Cook', 'Nouvelle-Zélande', 'NZ', -43.595, 170.1418),
  mountain('Mont Kosciuszko', 'Australie', 'AU', -36.4559, 148.2636),
  mountain('Mauna Kea', 'États-Unis', 'US', 19.8207, -155.4681),
  mountain('Mont Rainier', 'États-Unis', 'US', 46.8523, -121.7603),
  mountain('Popocatépetl', 'Mexique', 'MX', 19.0225, -98.6278),
  mountain('Cotopaxi', 'Équateur', 'EC', -0.6807, -78.4376),
  mountain('Huascarán', 'Pérou', 'PE', -9.1219, -77.6042),
  mountain('Montagne de la Table', 'Afrique du Sud', 'ZA', -33.9628, 18.4098),
  mountain('Kinabalu', 'Malaisie', 'MY', 6.0754, 116.5583),
  mountain('Damavand', 'Iran', 'IR', 35.9558, 52.1099),
];
