"use client";

import { useState } from "react";
import { Loader2, LogOut, User as UserIcon } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/hooks/useAuth";
import { RoomCreationPanel } from "@/components/dashboard/RoomCreationPanel";
import { RoomJoinPanel } from "@/components/dashboard/RoomJoinPanel";
import { ActiveRoomDisplay } from "@/components/dashboard/ActiveRoomDisplay";
import { ColorSettingsPanel } from "@/components/dashboard/ColorSettingsPanel";
import Link from "next/link";

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const { isConnected, room, timeLeft, createRoom, joinRoom, startMatch, cancelRoom, manualScoreUpdate, addTime } = useSocket();

  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = async (duration: number) => {
    const twitchId = user?.twitchId || user?.id;
    if (user && twitchId && user.accessToken) {
      setIsCreating(true);
      await createRoom(duration, user.display_name, twitchId, user.accessToken);
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (roomId: string) => {
    const twitchId = user?.twitchId || user?.id;
    if (user && twitchId && user.accessToken) {
      setIsJoining(true);
      await joinRoom(roomId, user.display_name, twitchId, user.accessToken);
      setIsJoining(false);
    }
  };

  const handleStartMatch = async () => {
    if (room) await startMatch(room.id);
  };

  const handleCancelMatch = async () => {
    const twitchId = user?.twitchId || user?.id;
    if (room && twitchId) {
      await cancelRoom(room.id, twitchId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-neon-blue animate-spin" />
      </div>
    );
  }

  // Si on n'a pas pu rediriger pour une raison quelconque
  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-bg text-white p-8">
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between bg-dark-surface p-4 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-4">
          <img 
            src={user.profile_image_url || "https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74def228c3-profile_image-70x70.png"} 
            alt="Profile" 
            className="w-12 h-12 rounded-full border-2 border-neon-blue"
          />
          <div>
            <h2 className="text-xl font-bold">{user.display_name}</h2>
            <p className="text-sm text-gray-400">Streamer Connecté {isConnected ? '(WebSocket)' : '(Déconnecté)'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            href={`/streamer/${user.login || user.display_name}`}
            className="flex items-center gap-2 px-4 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/50 hover:bg-neon-blue/20 rounded-lg font-bold transition-colors"
          >
            <UserIcon className="w-4 h-4" /> Mon Profil Public
          </Link>
          <button 
            onClick={logout}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {!room ? (
          <>
            <div className="relative">
              {isCreating && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl backdrop-blur-sm"><Loader2 className="w-8 h-8 text-neon-blue animate-spin" /></div>}
              <RoomCreationPanel onCreate={handleCreateRoom} />
            </div>
            <div className="relative">
              {isJoining && <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center rounded-2xl backdrop-blur-sm"><Loader2 className="w-8 h-8 text-neon-pink animate-spin" /></div>}
              <RoomJoinPanel onJoin={handleJoinRoom} />
            </div>
            {user?.id && <ColorSettingsPanel userId={user.id} />}
          </>
        ) : (
          <ActiveRoomDisplay 
            room={room} 
            timeLeft={timeLeft} 
            currentUserDisplayName={user.display_name} 
            onStartMatch={handleStartMatch} 
            onCancelMatch={handleCancelMatch}
            onManualScoreUpdate={(streamerLogin, delta) => {
              const twitchId = user?.twitchId || user?.id;
              if (room && twitchId) manualScoreUpdate(room.id, streamerLogin, delta, twitchId);
            }}
            onAddTime={(seconds) => {
              const twitchId = user?.twitchId || user?.id;
              if (room && twitchId) addTime(room.id, seconds, twitchId);
            }}
          />
        )}
      </main>
    </div>
  );
}
