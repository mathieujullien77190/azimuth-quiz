import { useEffect, useState } from 'react';

/** The angle (radians) of something that goes round once every `periodMs`, moved every `tickMs`. */
export const useOrbitAngle = (periodMs: number, tickMs: number): number => {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setAngle((current) => current + (2 * Math.PI * tickMs) / periodMs), tickMs);
    return () => clearInterval(timer);
  }, [periodMs, tickMs]);
  return angle;
};
