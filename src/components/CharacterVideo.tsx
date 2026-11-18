import { useEffect, useRef } from 'react';

type CharacterVideoProps = {
  id: string;
  name: string;
  play: boolean;
  className?: string;
};

export function CharacterVideo({ id, name, play, className = '' }: CharacterVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const basePath = `/videos/${id}_marta`;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (play) {
      void video.play().catch(() => {
        // Some mobile browsers wait for the next user gesture before autoplay.
      });
    } else {
      video.pause();
    }
  }, [play]);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay={play}
      loop
      muted
      playsInline
      preload={play ? 'metadata' : 'none'}
      poster={`${basePath}-poster.png`}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={`${basePath}.mov`} type={'video/quicktime; codecs="ap4h"'} />
      <source src={`${basePath}.webm`} type={'video/webm; codecs="vp9"'} />
      Tu navegador no puede mostrar la animación de {name}.
    </video>
  );
}
