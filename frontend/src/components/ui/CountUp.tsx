import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function CountUp({ value, duration = 1500, suffix = '', prefix = '' }: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    const from = startValueRef.current;
    const to = value;
    startTimeRef.current = null;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Ease out cubic
    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(timestamp: number) {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const current = from + (to - from) * easedProgress;

      setDisplay(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplay(to);
        startValueRef.current = to;
        rafRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  const formatted = Math.round(display).toLocaleString();

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default CountUp;
