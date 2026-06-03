'use client';

import { useEffect } from 'react';

const SCRIPT_SRC = 'https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': any;
    }
  }
}

export default function SunLottie({ className, width = 80, height = 80 }: { className?: string; width?: number; height?: number; }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).customElements?.get('lottie-player')) return;

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className={className}>
      <lottie-player
        src="/animations/sun.json"
        background="transparent"
        speed="1"
        loop
        autoplay
        style={{ width, height, margin: '0 auto' }}
      />
    </div>
  );
}
