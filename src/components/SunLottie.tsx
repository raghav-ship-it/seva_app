'use client';

export default function SunLottie({ className, size = 140 }: { className?: string; size?: number; }) {
  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-block',
    background: '#FFFBEB',
    boxShadow: '0 6px 18px rgba(0,0,0,0.08)'
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none'
  };

  return (
    <div className={className} style={wrapperStyle} aria-hidden>
      <video
        src="/animations/sun.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={videoStyle}
      />
    </div>
  );
}
