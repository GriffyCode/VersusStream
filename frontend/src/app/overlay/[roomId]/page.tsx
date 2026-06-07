"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { VSBattleWidget } from "@/components/overlay/VSBattleWidget";

export default function OverlayPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { isConnected, room, timeLeft, spectateRoom, adminAlert } = useSocket();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Hide the body background to make it transparent for OBS
    document.body.style.backgroundColor = "transparent";

    if (roomId && !room) {
      spectateRoom(roomId).then((res: any) => {
        if (!res.success) {
          setError(res.message);
        }
      });
    }

    return () => {
      // Restore background on unmount if needed
      document.body.style.backgroundColor = "";
    };
  }, [roomId, spectateRoom, room]);

  if (error) {
    return <div className="text-red-500 font-bold p-4 bg-black/50 text-xl">{error}</div>;
  }

  if (!room) {
    return <div className="text-white font-bold p-4 bg-black/50 text-xl">En attente de la salle {roomId}...</div>;
  }

  return (
    <div className="min-h-screen bg-transparent overflow-hidden relative">
      {adminAlert && (
        <div className="absolute top-64 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-orange-500 to-neon-pink text-white font-black text-4xl px-8 py-4 rounded-xl border-4 border-white shadow-[0_0_30px_rgba(255,0,234,0.8)] whitespace-nowrap">
            ⚠️ MODIFICATION ARBITRE : {adminAlert}
          </div>
        </div>
      )}
      
      <VSBattleWidget 
        streamerA={room.streamerA || 'JOUEUR 1'}
        streamerB={room.streamerB || 'JOUEUR 2'}
        scoreA={room.scoreA}
        scoreB={room.scoreB}
        timeLeft={timeLeft !== null ? timeLeft : room.duration}
        status={room.status}
        primaryColorA={room.primaryColorA}
        primaryColorB={room.primaryColorB}
      />
    </div>
  );
}
