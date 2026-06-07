"use client";

import { motion } from "framer-motion";
import { Gamepad2, Swords, LogIn } from "lucide-react";

export default function Home() {
  const handleLogin = () => {
    // Rediriger vers l'API Backend pour l'authentification OAuth Twitch
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/twitch`;
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue rounded-full blur-[150px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-pink rounded-full blur-[150px] opacity-20 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 flex flex-col items-center text-center p-8 max-w-2xl"
      >
        <div className="flex items-center justify-center gap-4 mb-6">
          <Gamepad2 className="w-16 h-16 text-neon-blue drop-shadow-[0_0_15px_rgba(0,243,255,0.8)]" />
          <Swords className="w-12 h-12 text-white opacity-50" />
          <Gamepad2 className="w-16 h-16 text-neon-pink drop-shadow-[0_0_15px_rgba(255,0,234,0.8)]" />
        </div>
        
        <h1 className="text-6xl font-black mb-4 tracking-tighter">
          <span className="text-neon-blue">TWITCH</span>
          <span className="text-white mx-2">VERSUS</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 max-w-lg">
          Défiez d'autres streamers en temps réel. Engagez votre communauté dans des duels épiques directement depuis votre chat Twitch.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="group relative flex items-center gap-3 px-8 py-4 bg-dark-surface border border-gray-800 rounded-xl overflow-hidden hover:border-[#9146FF] transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#9146FF]/0 via-[#9146FF]/10 to-[#9146FF]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <LogIn className="w-6 h-6 text-[#9146FF]" />
          <span className="text-lg font-bold text-white tracking-wide">Se connecter avec Twitch</span>
        </motion.button>

        <div className="mt-16 flex gap-8 text-sm font-medium text-gray-500">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-blue shadow-[0_0_8px_rgba(0,243,255,0.8)]" />
            100% Intégration OBS
          </span>
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-pink shadow-[0_0_8px_rgba(255,0,234,0.8)]" />
            Temps Réel Absolu
          </span>
        </div>
      </motion.div>
    </div>
  );
}
