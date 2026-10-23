import { useEffect, useState } from 'react';

/** Angle (radians) de ce qui fait un tour toutes les `periodMs`, deplace toutes les `tickMs`. */
export const useOrbitAngle = (periodMs: number, tickMs: number): number => {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setAngle((current) => current + (2 * Math.PI * tickMs) / periodMs), tickMs);
    return () => clearInterval(timer);
  }, [periodMs, tickMs]);
  return angle;
};
