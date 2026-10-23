'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { src: string; poster?: string; label: string; className?: string };

/** Loads the file only when it is about to be seen, plays on click with sound, native controls once started. */
export function VideoPlayer({ src, poster, label, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '100% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={near ? src : undefined}
      poster={poster}
      preload={near ? 'metadata' : 'none'}
      playsInline
      controls={started}
      aria-label={label}
      onClick={(e) => {
        if (!started) {
          setStarted(true);
          void e.currentTarget.play();
        }
      }}
    />
  );
}
