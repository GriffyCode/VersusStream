'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function StreamerProfile() {
  const { username } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/stats/${username}`);
        const result = await res.json();
        if (result.success) {
          setData(result);
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <h1 className="text-4xl font-bold text-red-500">Streamer introuvable</h1>
      </div>
    );
  }

  const { user, stats, recentMatches } = data;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Profil */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex items-center gap-8 shadow-2xl">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-32 h-32 rounded-full border-4 shadow-lg" style={{ borderColor: user.primaryColor }} />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 flex items-center justify-center text-4xl font-bold uppercase" style={{ borderColor: user.primaryColor, backgroundColor: `${user.primaryColor}33` }}>
              {user.displayName.substring(0, 2)}
            </div>
          )}
          <div>
            <h1 className="text-5xl font-black uppercase tracking-wider" style={{ textShadow: `0 0 15px ${user.primaryColor}80` }}>
              {user.displayName}
            </h1>
            <div className="flex gap-4 mt-4">
              <div className="px-4 py-2 bg-black/50 rounded-lg border border-gray-700">
                <span className="text-gray-400 text-sm block">Couleur Principale</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: user.primaryColor }}></div>
                  <span className="font-mono">{user.primaryColor}</span>
                </div>
              </div>
              <div className="px-4 py-2 bg-black/50 rounded-lg border border-gray-700">
                <span className="text-gray-400 text-sm block">Couleur Secondaire</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: user.secondaryColor }}></div>
                  <span className="font-mono">{user.secondaryColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques Globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundColor: user.primaryColor }}></div>
            <span className="text-gray-400 font-bold mb-2 z-10">TAUX DE VICTOIRE</span>
            <span className="text-6xl font-black font-mono z-10" style={{ color: user.primaryColor }}>
              {stats.winrate}%
            </span>
            <span className="text-sm text-gray-500 mt-2 z-10">{stats.wins} victoires / {stats.totalMatches} matchs</span>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-gray-400 font-bold mb-2">RECORD DE POINTS</span>
            <span className="text-5xl font-black text-white font-mono">{stats.maxPoints.toLocaleString()}</span>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center">
            <span className="text-gray-400 font-bold mb-2">MATCHS JOUÉS</span>
            <span className="text-5xl font-black text-white font-mono">{stats.totalMatches}</span>
          </div>
        </div>

        {/* Historique des matchs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6">10 Derniers Matchs</h2>
          {recentMatches.length === 0 ? (
            <p className="text-gray-500 italic">Aucun match joué pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {recentMatches.map((match: any) => {
                const isWinner = match.vainqueurId === user.id;
                const isDraw = match.vainqueurId === "DRAW";
                
                return (
                  <div key={match.id} className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-gray-800">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">{new Date(match.date).toLocaleDateString('fr-FR')} - {new Date(match.date).toLocaleTimeString('fr-FR')}</span>
                      <span className="font-bold font-mono text-lg mt-1">
                        {match.scoreFinalA} - {match.scoreFinalB}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {isDraw ? (
                        <span className="px-4 py-1 bg-gray-700 text-white rounded font-bold uppercase">Égalité</span>
                      ) : isWinner ? (
                        <span className="px-4 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded font-bold uppercase shadow-[0_0_10px_rgba(74,222,128,0.2)]">Victoire</span>
                      ) : (
                        <span className="px-4 py-1 bg-red-500/20 text-red-400 border border-red-500/50 rounded font-bold uppercase">Défaite</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
