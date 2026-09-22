import * as Location from 'expo-location';

import { DEFAULT_ORIGIN, DEVICE_ORIGIN_NAME, LOCATION_TIMEOUT_MS } from '@/constants';
import type { Origin } from '@/types';

const fetchDeviceOrigin = async (): Promise<Origin> => {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) return DEFAULT_ORIGIN;

  const position =
    (await Location.getLastKnownPositionAsync()) ??
    (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

  return {
    name: DEVICE_ORIGIN_NAME,
    coordinates: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    isDevicePosition: true,
  };
};

/**
 * Position de l'appareil comme point de depart, ou Paris si refusee, indisponible
 * ou trop lente (permission en attente, pas de signal GPS...).
 */
export const resolveOrigin = async (): Promise<Origin> => {
  const timeout = new Promise<Origin>((resolve) => setTimeout(() => resolve(DEFAULT_ORIGIN), LOCATION_TIMEOUT_MS));
  try {
    return await Promise.race([fetchDeviceOrigin(), timeout]);
  } catch {
    return DEFAULT_ORIGIN;
  }
};
