import { useState } from 'react';

interface RoomCreationPanelProps {
  onCreate: (duration: number) => void;
}

export const RoomCreationPanel = ({ onCreate }: RoomCreationPanelProps) => {
  const [duration, setDuration] = useState(5);

  return (
    <div className="bg-dark-surface p-8 rounded-2xl border border-gray-800">
      <h3 className="text-2xl font-bold mb-6 text-neon-blue">Créer un Duel</h3>
      <label className="block text-gray-400 mb-2">Durée (minutes)</label>
      <input 
        type="number" 
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        className="w-full bg-[#09090b] border border-gray-700 rounded-lg p-3 text-white mb-6 focus:border-neon-blue outline-none transition-colors"
        min={1}
        max={60}
      />
      <button 
        onClick={() => onCreate(duration)}
        className="w-full px-8 py-4 bg-neon-blue text-black font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-[0_0_15px_rgba(0,243,255,0.4)]"
      >
        Générer le Salon
      </button>
    </div>
  );
};
