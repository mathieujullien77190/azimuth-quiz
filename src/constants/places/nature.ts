import type { Place } from '@/types';

import { placeFactory } from './helpers';

const nature = placeFactory('nature');

export const NATURE: Place[] = [
  // France
  nature('Dune du Pilat', 'France', 'FR', 44.5895, -1.213),
  nature('Gorges du Verdon', 'France', 'FR', 43.7369, 6.3268),
  nature('Falaises d’Étretat', 'France', 'FR', 49.7073, 0.205),
  nature('Calanques de Marseille', 'France', 'FR', 43.211, 5.44),
  nature('Camargue', 'France', 'FR', 43.4528, 4.4283),
  nature('Lac d’Annecy', 'France', 'FR', 45.864, 6.173),
  nature('Cirque de Gavarnie', 'France', 'FR', 42.7275, -0.0083),
  nature('Île de Porquerolles', 'France', 'FR', 43.0004, 6.2064),
  nature('Pointe du Raz', 'France', 'FR', 48.0358, -4.7367),
  nature('Île de Ré', 'France', 'FR', 46.19, -1.43),
  nature('Gorges de l’Ardèche', 'France', 'FR', 44.38, 4.5),
  nature('Belle-Île-en-Mer', 'France', 'FR', 47.34, -3.16),
  nature('Baie de Somme', 'France', 'FR', 50.23, 1.58),
  nature('Lac du Bourget', 'France', 'FR', 45.73, 5.86),

  // Monde
  nature('Grand Canyon', 'États-Unis', 'US', 36.1069, -112.1129),
  nature('Yellowstone', 'États-Unis', 'US', 44.428, -110.5885),
  nature('Chutes du Niagara', 'Canada', 'CA', 43.0962, -79.0377),
  nature('Lac Louise', 'Canada', 'CA', 51.4254, -116.1773),
  nature('Chutes Victoria', 'Zimbabwe', 'ZW', -17.9243, 25.8572),
  nature('Chutes d’Iguazú', 'Argentine', 'AR', -25.6953, -54.4367),
  nature('Uluru', 'Australie', 'AU', -25.3444, 131.0369),
  nature('Grande Barrière de corail', 'Australie', 'AU', -18.2871, 147.6992),
  nature('Lac Titicaca', 'Pérou', 'PE', -15.9254, -69.3354),
  nature('Lac Baïkal', 'Russie', 'RU', 53.5587, 108.165),
  nature('Lac Victoria', 'Tanzanie', 'TZ', -1.0, 33.0),
  nature('Mer Morte', 'Jordanie', 'JO', 31.559, 35.4732),
  nature('Désert d’Atacama', 'Chili', 'CL', -24.5, -69.25),
  nature('Îles Galápagos', 'Équateur', 'EC', -0.9538, -90.9656),
  nature('Île de Pâques', 'Chili', 'CL', -27.1127, -109.3497),
  nature('Bora Bora', 'Polynésie française', 'PF', -16.5004, -151.7415),
  nature('Maldives', 'Maldives', 'MV', 4.1755, 73.5093),
  nature('Santorin', 'Grèce', 'GR', 36.3932, 25.4615),
  nature('Madère', 'Portugal', 'PT', 32.7607, -16.9595),
  nature('Cap Nord', 'Norvège', 'NO', 71.1725, 25.784),
  nature('Cap Horn', 'Chili', 'CL', -55.9833, -67.2667),
  nature('Cap de Bonne-Espérance', 'Afrique du Sud', 'ZA', -34.3568, 18.474),
  nature('Geysir', 'Islande', 'IS', 64.3104, -20.3024),
  nature('Baie d’Halong', 'Viêt Nam', 'VN', 20.9101, 107.1839),
  nature('Zhangjiajie', 'Chine', 'CN', 29.317, 110.434),
  nature('Lac Léman', 'Suisse', 'CH', 46.45, 6.55),
  nature('Fjord de Geiranger', 'Norvège', 'NO', 62.1049, 7.2058),
  nature('Île Maurice', 'Maurice', 'MU', -20.3484, 57.5522),
  nature('Îles Fidji', 'Fidji', 'FJ', -17.7134, 178.065),
  nature('Delta de l’Okavango', 'Botswana', 'BW', -19.2833, 22.9),
  nature('Dunes de Sossusvlei', 'Namibie', 'NA', -24.7275, 15.3405),
];
