import type { Place } from '@/types';

import { placeFactory, tier } from './helpers';

const kid = placeFactory('kids');
// Categorie deja pensee "facile" par nature (lieux tres reconnaissables pour des enfants) :
// une seule difficulte, pas de repartition en paliers.
const easy = tier('easy');

export const KIDS: Place[] = easy([
  // Europe
  kid('Tour Eiffel', 'France', 'FR', 48.8584, 2.2945),
  kid('Notre-Dame de Paris', 'France', 'FR', 48.853, 2.3499),
  kid('Big Ben', 'Royaume-Uni', 'GB', 51.5007, -0.1246),
  kid('Stonehenge', 'Royaume-Uni', 'GB', 51.1789, -1.8262),
  kid('Colisée', 'Italie', 'IT', 41.8902, 12.4922),
  kid('Tour de Pise', 'Italie', 'IT', 43.723, 10.3966),
  kid('Kremlin et place Rouge', 'Russie', 'RU', 55.7539, 37.6208),
  kid('Acropole d’Athènes', 'Grèce', 'GR', 37.9715, 23.7257),

  // Afrique
  kid('Pyramides de Gizeh', 'Égypte', 'EG', 29.9792, 31.1342),
  kid('Grand Sphinx de Gizeh', 'Égypte', 'EG', 29.9753, 31.1376),
  kid('Table Mountain', 'Afrique du Sud', 'ZA', -33.9628, 18.4098),

  // Asie
  kid('Grande Muraille de Chine', 'Chine', 'CN', 40.3599, 116.0204),
  kid('Taj Mahal', 'Inde', 'IN', 27.1751, 78.0421),
  kid('Mont Fuji', 'Japon', 'JP', 35.3606, 138.7274),
  kid('Pétra', 'Jordanie', 'JO', 30.3285, 35.4444),
  kid('Mont Everest', 'Népal', 'NP', 27.9881, 86.925),
  kid('Burj Khalifa', 'Émirats arabes unis', 'AE', 25.1972, 55.2744),

  // Océanie
  kid('Opéra de Sydney', 'Australie', 'AU', -33.8568, 151.2153),
  kid('Uluru', 'Australie', 'AU', -25.3444, 131.0369),

  // Amérique du Nord
  kid('Statue de la Liberté', 'États-Unis', 'US', 40.6892, -74.0445),
  kid('Golden Gate Bridge', 'États-Unis', 'US', 37.8199, -122.4783),
  kid('Mont Rushmore', 'États-Unis', 'US', 43.8791, -103.4591),
  kid('Chutes du Niagara', 'Canada', 'CA', 43.0962, -79.0377),
  kid('Chichén Itzá', 'Mexique', 'MX', 20.6843, -88.5678),

  // Amérique du Sud
  kid('Cristo Redentor', 'Brésil', 'BR', -22.9519, -43.2105),
  kid('Machu Picchu', 'Pérou', 'PE', -13.1631, -72.545),

  // Encore plus de lieux faciles a reconnaitre
  kid('Sagrada Família', 'Espagne', 'ES', 41.4036, 2.1744),
  kid('Château de Neuschwanstein', 'Allemagne', 'DE', 47.5576, 10.7498),
  kid('Mont-Saint-Michel', 'France', 'FR', 48.6361, -1.5115),
  kid('Disneyland Paris', 'France', 'FR', 48.8722, 2.7761),
  kid('Legoland Billund', 'Danemark', 'DK', 55.7307, 9.1339),
  kid('London Eye', 'Royaume-Uni', 'GB', 51.5033, -0.1195),
  kid('Fontaine de Trevi', 'Italie', 'IT', 41.9009, 12.4833),
  kid('Place Saint-Marc, Venise', 'Italie', 'IT', 45.4342, 12.3388),
  kid('Alhambra', 'Espagne', 'ES', 37.1761, -3.5881),
  kid('Loch Ness', 'Royaume-Uni', 'GB', 57.3229, -4.4244),
  kid('Angkor Vat', 'Cambodge', 'KH', 13.4125, 103.867),
  kid('Cité interdite', 'Chine', 'CN', 39.9163, 116.3972),
  kid('Armée de terre cuite de Xi’an', 'Chine', 'CN', 34.3841, 109.2785),
  kid('Borobudur', 'Indonésie', 'ID', -7.6079, 110.2038),
  kid('Grande Barrière de corail', 'Australie', 'AU', -18.2871, 147.6992),
  kid('Panneau Hollywood', 'États-Unis', 'US', 34.1341, -118.3215),
  kid('Empire State Building', 'États-Unis', 'US', 40.7484, -73.9857),
  kid('Tour CN', 'Canada', 'CA', 43.6426, -79.3871),
  kid('Îles Galápagos', 'Équateur', 'EC', -0.9538, -90.9656),
  kid('Chutes d’Iguazú', 'Argentine', 'AR', -25.6953, -54.4367),
  kid('Chutes Victoria', 'Zimbabwe', 'ZW', -17.9243, 25.8572),
  kid('Kilimandjaro', 'Tanzanie', 'TZ', -3.0674, 37.3556),
  kid('Parc national du Serengeti', 'Tanzanie', 'TZ', -2.3333, 34.8333),
  kid('Île de Pâques', 'Chili', 'CL', -27.1127, -109.3497),
  kid('Bora Bora', 'Polynésie française', 'PF', -16.5004, -151.7415),
  kid('Parc national de Yellowstone', 'États-Unis', 'US', 44.428, -110.5885),

  // Encore
  kid('Disney World', 'États-Unis', 'US', 28.3852, -81.5639),
  kid('Grand Canyon', 'États-Unis', 'US', 36.1069, -112.1129),
  kid('Space Needle', 'États-Unis', 'US', 47.6205, -122.3493),
  kid('Tour de Tokyo', 'Japon', 'JP', 35.6586, 139.7454),
  kid('Pain de Sucre', 'Brésil', 'BR', -22.9486, -43.1566),
  kid('Sydney Harbour Bridge', 'Australie', 'AU', -33.8523, 151.2108),
  kid('Burj Al Arab', 'Émirats arabes unis', 'AE', 25.1412, 55.1853),
  kid('Château de Windsor', 'Royaume-Uni', 'GB', 51.4839, -0.6044),
  kid('Buckingham Palace', 'Royaume-Uni', 'GB', 51.5014, -0.1419),
  kid('Manneken Pis', 'Belgique', 'BE', 50.8449, 4.3499),
  kid('Atomium', 'Belgique', 'BE', 50.8949, 4.3415),
  kid('Pyramide du Louvre', 'France', 'FR', 48.8611, 2.3358),
  kid('Vésuve', 'Italie', 'IT', 40.8224, 14.4289),
]);
