import React, { useEffect, useState } from 'react';

interface VSBattleWidgetProps {
  streamerA: string;
  streamerB: string;
  scoreA: number;
  scoreB: number;
  timeLeft: number;
  status?: string;
  primaryColorA?: string;
  primaryColorB?: string;
}

export const VSBattleWidget: React.FC<VSBattleWidgetProps> = ({ 
  streamerA, 
  streamerB, 
  scoreA, 
  scoreB, 
  timeLeft, 
  status,
  primaryColorA = '#00f0ff',
  primaryColorB = '#ff007f'
}) => {
  const [shakeA, setShakeA] = useState(false);
  const [shakeB, setShakeB] = useState(false);

  // Trigger shake animation when scores increase
  useEffect(() => {
    if (scoreA > 0 && status === 'IN_PROGRESS') {
      setShakeA(true);
      const timer = setTimeout(() => setShakeA(false), 500);
      return () => clearTimeout(timer);
    }
  }, [scoreA, status]);

  useEffect(() => {
    if (scoreB > 0 && status === 'IN_PROGRESS') {
      setShakeB(true);
      const timer = setTimeout(() => setShakeB(false), 500);
      return () => clearTimeout(timer);
    }
  }, [scoreB, status]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const baseline = 1000;
  const maxScore = Math.max(baseline, scoreA, scoreB);
  
  const widthA = Math.min(100, Math.max(0, (scoreA / maxScore) * 100));
  const widthB = Math.min(100, Math.max(0, (scoreB / maxScore) * 100));

  let winnerText = "DRAW!";
  if (scoreA > scoreB) winnerText = `${streamerA} WINS!`;
  if (scoreB > scoreA) winnerText = `${streamerB} WINS!`;

  return (
    <div className="w-full max-w-[1920px] mx-auto p-8 font-sans">
      <div className="flex justify-between items-start gap-8">
        
        {/* Streamer A (Left) */}
        <div className={`flex-1 flex flex-col gap-2 ${shakeA ? 'animate-shake' : ''}`}>
          <div className="flex justify-between items-baseline px-2">
            <span 
              className="text-4xl font-black text-white uppercase tracking-wider"
              style={{ textShadow: `0 0 10px ${primaryColorA}cc` }}
            >
              {streamerA}
            </span>
            <span 
              className="text-3xl font-bold font-mono tabular-nums"
              style={{ color: primaryColorA }}
            >
              {scoreA.toLocaleString()} PTS
            </span>
          </div>
          {/* Jauge A */}
          <div className="h-12 w-full bg-gray-900/80 rounded-r-3xl rounded-l-md border-2 border-gray-700 overflow-hidden transform skew-x-[-15deg]">
            <div 
              className="h-full transition-all duration-300 ease-out flex items-center justify-end px-4"
              style={{ width: `${widthA}%`, backgroundColor: primaryColorA }}
            >
              <div className="w-2 h-full bg-white/50 skew-x-[15deg]"></div>
            </div>
          </div>
        </div>

        {/* Center : Timer or Victory */}
        <div className="flex flex-col items-center justify-center shrink-0 min-w-[200px] mt-4 relative">
          {status === 'ENDED' ? (
            <div className="absolute top-0 flex flex-col items-center justify-center animate-bounce z-50">
              <div className="text-5xl font-black text-red-500 font-mono drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] tracking-tighter italic">
                TIME OVER
              </div>
              <div className="text-4xl font-black text-yellow-400 mt-2 drop-shadow-[0_0_20px_rgba(255,255,0,1)] uppercase whitespace-nowrap px-4 py-2 bg-black/50 rounded-full border-2 border-yellow-400">
                {winnerText}
              </div>
            </div>
          ) : (
            <>
              <div className="text-6xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </div>
              <div className="text-white font-bold text-2xl tracking-[0.3em] mt-2 opacity-50">VS</div>
            </>
          )}
        </div>

        {/* Streamer B (Right) */}
        <div className={`flex-1 flex flex-col gap-2 ${shakeB ? 'animate-shake' : ''}`}>
          <div className="flex justify-between items-baseline px-2 flex-row-reverse">
            <span 
              className="text-4xl font-black text-white uppercase tracking-wider"
              style={{ textShadow: `0 0 10px ${primaryColorB}cc` }}
            >
              {streamerB}
            </span>
            <span 
              className="text-3xl font-bold font-mono tabular-nums"
              style={{ color: primaryColorB }}
            >
              {scoreB.toLocaleString()} PTS
            </span>
          </div>
          {/* Jauge B */}
          <div className="h-12 w-full bg-gray-900/80 rounded-l-3xl rounded-r-md border-2 border-gray-700 overflow-hidden transform skew-x-[15deg] flex justify-end">
            <div 
              className="h-full transition-all duration-300 ease-out flex items-center justify-start px-4"
              style={{ width: `${widthB}%`, backgroundColor: primaryColorB }}
            >
              <div className="w-2 h-full bg-white/50 skew-x-[-15deg]"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
