import { Play, Swords, Plus, Minus, Clock } from 'lucide-react';

interface ActiveRoomDisplayProps {
  room: {
    id: string;
    streamerA: string | null;
    streamerB: string | null;
    scoreA: number;
    scoreB: number;
    duration: number;
    status: string;
    logs?: string[];
  };
  timeLeft: number | null;
  currentUserDisplayName?: string;
  onStartMatch: () => void;
  onCancelMatch?: () => void;
  onManualScoreUpdate?: (streamerLogin: string, delta: number) => void;
  onAddTime?: (seconds: number) => void;
}

export const ActiveRoomDisplay = ({ 
  room, 
  timeLeft, 
  currentUserDisplayName, 
  onStartMatch,
  onCancelMatch,
  onManualScoreUpdate,
  onAddTime
}: ActiveRoomDisplayProps) => {
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isCreator = room.streamerA === currentUserDisplayName;
  const inProgress = room.status === 'IN_PROGRESS';

  return (
    <div className="col-span-1 md:col-span-2 bg-dark-surface p-8 rounded-2xl border border-neon-blue text-center">
      <h3 className="text-3xl font-bold mb-2">Salon : {room.id}</h3>
      <p className="text-gray-400 mb-8">Partagez cet ID avec votre adversaire.</p>
      
      <div className="flex justify-center items-start gap-8 mb-8">
        {/* Streamer A */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-neon-blue mb-2">{room.streamerA || 'En attente...'}</div>
          <div className="text-3xl font-mono mb-4">{room.scoreA.toLocaleString()} pts</div>
          {isCreator && inProgress && room.streamerA && onManualScoreUpdate && (
            <div className="flex flex-wrap gap-2 justify-center max-w-[150px]">
              <button onClick={() => onManualScoreUpdate(room.streamerA!, 100)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 text-sm font-bold">+100</button>
              <button onClick={() => onManualScoreUpdate(room.streamerA!, -100)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 text-sm font-bold">-100</button>
              <button onClick={() => onManualScoreUpdate(room.streamerA!, 1000)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 text-sm font-bold">+1k</button>
              <button onClick={() => onManualScoreUpdate(room.streamerA!, -1000)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 text-sm font-bold">-1k</button>
            </div>
          )}
        </div>

        <Swords className="w-12 h-12 text-gray-600 mt-2" />
        
        {/* Streamer B */}
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-neon-pink mb-2">{room.streamerB || 'En attente...'}</div>
          <div className="text-3xl font-mono mb-4">{room.scoreB.toLocaleString()} pts</div>
          {isCreator && inProgress && room.streamerB && onManualScoreUpdate && (
            <div className="flex flex-wrap gap-2 justify-center max-w-[150px]">
              <button onClick={() => onManualScoreUpdate(room.streamerB!, 100)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 text-sm font-bold">+100</button>
              <button onClick={() => onManualScoreUpdate(room.streamerB!, -100)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 text-sm font-bold">-100</button>
              <button onClick={() => onManualScoreUpdate(room.streamerB!, 1000)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/40 text-sm font-bold">+1k</button>
              <button onClick={() => onManualScoreUpdate(room.streamerB!, -1000)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40 text-sm font-bold">-1k</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center mb-12">
        <div className="text-6xl font-black font-mono tabular-nums mb-4">
          {formatTime(timeLeft !== null ? timeLeft : room.duration)}
        </div>
        {isCreator && inProgress && onAddTime && (
          <button 
            onClick={() => onAddTime(60)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 text-sm font-bold transition-colors"
          >
            <Clock className="w-4 h-4" /> +60s
          </button>
        )}
      </div>

      {room.status === 'WAITING' && isCreator && (
        <div className="flex flex-col items-center gap-4 mb-8">
          <button 
            onClick={onStartMatch}
            disabled={!room.streamerB}
            className={`flex items-center gap-2 px-8 py-4 font-bold rounded-xl transition-colors ${
              room.streamerB 
                ? 'bg-white text-black hover:bg-gray-200 shadow-[0_0_15px_rgba(255,255,255,0.5)]' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className={`w-5 h-5 ${room.streamerB ? 'fill-black' : 'fill-gray-500'}`} /> 
            {room.streamerB ? 'Lancer le Duel' : 'En attente d\'un adversaire...'}
          </button>
          
          {onCancelMatch && (
            <button 
              onClick={onCancelMatch}
              className="text-red-500 hover:text-red-400 text-sm font-bold underline underline-offset-4"
            >
              Annuler et fermer le salon
            </button>
          )}
        </div>
      )}

      {inProgress && isCreator && onCancelMatch && (
        <div className="flex flex-col items-center gap-4 mb-8">
          <button 
            onClick={onCancelMatch}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-colors"
          >
            Arrêter le duel prématurément
          </button>
        </div>
      )}

      {room.status === 'ENDED' && (
        <div className="text-2xl text-neon-pink font-bold animate-pulse mb-8">
          LE MATCH EST TERMINÉ !
        </div>
      )}

      {/* Journal d'événements */}
      {room.logs && room.logs.length > 0 && (
        <div className="mt-8 text-left bg-black/50 p-4 rounded-xl border border-gray-800">
          <h4 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Journal d'Événements
          </h4>
          <div className="h-48 overflow-y-auto pr-2 space-y-2 text-sm text-gray-400 font-mono scrollbar-thin scrollbar-thumb-gray-700">
            {room.logs.map((log, i) => (
              <div key={i} className="border-b border-gray-800 pb-1">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
