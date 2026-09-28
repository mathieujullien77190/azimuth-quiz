import { useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';

import { onCapFromScroll } from './helpers';

/** How long an animated scroll is given to arrive before a manual drag is believed again. */
const TRAVEL_MS = 800;

/**
 * The heading/distance sections of a round sit one above the other in a scroll view, and the
 * footer's "Suivant"/"Précédent" button leads to the other one. `onCap` says which section the round
 * is scrolled to, so which label the button shows: set at once when the button is pressed, and kept
 * in sync when the player drags the scroll by hand.
 *
 * While the scroll the button started is on its way, the scroll events of the *departure* edge are
 * ignored: reading them straight away used to flip the label back the instant it changed (the
 * animation still starts next to the top), so it only changed for good once the scroll arrived.
 */
export const useSectionScroll = () => {
  const scrollRef = useRef<ScrollView>(null);
  const [onCap, setOnCap] = useState(false);
  // The section a button-driven scroll is heading to, while it's still on its way.
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
      // Still leaving the departure edge: not the player's doing, don't flip the label back.
      if (next !== targetRef.current) return;
      targetRef.current = null;
    }
    setOnCap(next);
  };

  return { scrollRef, onCap, goToCap, goToDistance, handleScroll };
};
