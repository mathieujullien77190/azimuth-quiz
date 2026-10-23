import { useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import { onCapFromScroll } from './helpers';

/** Delai laisse a un defilement anime pour arriver avant de recroire un glissement manuel. */
const TRAVEL_MS = 800;

/**
 * Les sections cap/distance sont l'une sous l'autre dans un scroll ; le bouton du pied mene a l'autre.
 * `onCap` dit sur quelle section on est (donc le libelle) : fixe a l'appui, resynchronise quand le joueur
 * defile a la main. Pendant le defilement du bouton, les evenements du bord de DEPART sont ignores
 * (l'animation part pres du haut : le libelle repartait en arriere).
 */
export const useSectionScroll = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [onCap, setOnCap] = useState(false);
  // Section visee par un defilement du bouton, tant qu'il est en route.
  const targetRef = useRef<boolean | null>(null);
  const travelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (travelTimeout.current !== null) clearTimeout(travelTimeout.current);
    },
    [],
  );

  const travelTo = (onCapTarget: boolean) => {
    targetRef.current = onCapTarget;
    if (travelTimeout.current !== null) clearTimeout(travelTimeout.current);
    travelTimeout.current = setTimeout(() => {
      targetRef.current = null;
    }, TRAVEL_MS);
    setOnCap(onCapTarget);
  };

  const goToCap = () => {
    travelTo(true);
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  const goToDistance = () => {
    travelTo(false);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = onCapFromScroll(event);
    if (next === null) return;
    if (targetRef.current !== null) {
      // Quitte encore le bord de depart : pas le fait du joueur, ne pas rebasculer le libelle.
      if (next !== targetRef.current) return;
      targetRef.current = null;
    }
    setOnCap(next);
  };

  return { scrollRef, onCap, goToCap, goToDistance, handleScroll };
};
