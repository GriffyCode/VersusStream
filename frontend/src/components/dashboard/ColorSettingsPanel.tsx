"use client";

import { useState, useEffect } from "react";
import { Loader2, Palette } from "lucide-react";

interface ColorSettingsPanelProps {
  userId: string;
}

export const ColorSettingsPanel = ({ userId }: ColorSettingsPanelProps) => {
  const [primaryColor, setPrimaryColor] = useState("#00f0ff");
  const [secondaryColor, setSecondaryColor] = useState("#ff007f");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch user settings
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`http://localhost:3001/api/settings/${userId}`);
        const data = await res.json();
        if (data.success && data.settings) {
          setPrimaryColor(data.settings.primaryColor);
          setSecondaryColor(data.settings.secondaryColor);
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [userId]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:3001/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, primaryColor, secondaryColor }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Couleurs sauvegardées avec succès !");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Erreur réseau.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-dark-surface p-6 rounded-2xl border border-gray-800 flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-dark-surface p-6 rounded-2xl border border-gray-800 col-span-1 md:col-span-2">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Palette className="w-6 h-6 text-neon-blue" />
        Personnalisation de l'Overlay
      </h3>
      
      <p className="text-gray-400 mb-6 text-sm">
        Choisissez vos couleurs pour personnaliser votre barre de duel. 
        Vos adversaires verront vos couleurs quand vous créez un salon, et inversement.
      </p>

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-center bg-black/30 p-6 rounded-xl border border-gray-700">
        {/* Streamer Color (Primary) */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-sm font-bold text-gray-300">Votre Couleur (Gauche)</label>
          <div className="relative">
            <input 
              type="color" 
              value={primaryColor} 
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-16 rounded-full cursor-pointer bg-transparent border-none outline-none overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            />
            <div 
              className="absolute inset-0 rounded-full pointer-events-none ring-4 ring-black/50 shadow-inner"
              style={{ boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 0 20px ${primaryColor}80` }}
            ></div>
          </div>
          <span className="font-mono text-xs text-gray-500 uppercase">{primaryColor}</span>
        </div>

        <div className="text-4xl font-black text-gray-700 select-none">VS</div>

        {/* Opponent Color (Secondary) */}
        <div className="flex flex-col items-center gap-2">
          <label className="text-sm font-bold text-gray-300">Couleur Adversaire (Droite)</label>
          <div className="relative">
            <input 
              type="color" 
              value={secondaryColor} 
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-16 h-16 rounded-full cursor-pointer bg-transparent border-none outline-none overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none"
            />
            <div 
              className="absolute inset-0 rounded-full pointer-events-none ring-4 ring-black/50 shadow-inner"
              style={{ boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 0 20px ${secondaryColor}80` }}
            ></div>
          </div>
          <span className="font-mono text-xs text-gray-500 uppercase">{secondaryColor}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-3 bg-neon-blue text-black font-bold rounded-xl hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sauvegarder les couleurs'}
        </button>
        {message && (
          <span className={`text-sm font-bold ${message.includes('succès') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};
