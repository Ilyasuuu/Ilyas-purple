
import React, { useMemo } from 'react';

const SnowEffect: React.FC = () => {
  // Generate random flakes with useMemo to prevent re-calc on re-renders
  const flakes = useMemo(() => {
    return Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: Math.random() * 15 + 15 + 's', // Slower fall (5-10s)
      animationDelay: -Math.random() * 10 + 's', // Start instantly (negative delay)
      opacity: Math.random() * 0.5 + 0.3,
      size: Math.random() * 3 + 2 + 'px'
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {flakes.map(flake => (
        <div
          key={flake.id}
          className="absolute top-[-10px] bg-white rounded-full"
          style={{
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animation: `fall ${flake.animationDuration} linear infinite`,
            animationDelay: flake.animationDelay,
            filter: 'blur(0.5px)',
            boxShadow: '0 0 5px rgba(255,255,255,0.8)'
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0px); }
          50% { transform: translateY(55vh) translateX(20px); }
          100% { transform: translateY(110vh) translateX(-10px); }
        }
      `}</style>
    </div>
  );
};

export default SnowEffect;
