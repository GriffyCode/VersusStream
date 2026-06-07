import { useState } from 'react';

interface RoomJoinPanelProps {
  onJoin: (roomId: string) => void;
}

export const RoomJoinPanel = ({ onJoin }: RoomJoinPanelProps) => {
  const [joinId, setJoinId] = useState("");

  return (
    <div className="bg-dark-surface p-8 rounded-2xl border border-gray-800">
      <h3 className="text-2xl font-bold mb-6 text-neon-pink">Rejoindre un Duel</h3>
      <label className="block text-gray-400 mb-2">ID du Salon</label>
      <input 
        type="text" 
        value={joinId}
        onChange={(e) => setJoinId(e.target.value)}
        placeholder="Ex: room_abc123"
        className="w-full bg-[#09090b] border border-gray-700 rounded-lg p-3 text-white mb-6 focus:border-neon-pink outline-none transition-colors"
      />
      <button 
        onClick={() => onJoin(joinId)}
        className="w-full px-8 py-4 bg-neon-pink text-white font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-[0_0_15px_rgba(255,0,234,0.4)]"
      >
        Rejoindre
      </button>
    </div>
  );
};
