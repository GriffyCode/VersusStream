import { redisService } from './redis.service';
import { prismaService } from './prisma.service';

export interface Room {
  id: string;
  streamerA: string | null;
  twitchIdA: string | null;
  accessTokenA: string | null;
  primaryColorA: string | null;
  secondaryColorA: string | null;
  streamerB: string | null;
  twitchIdB: string | null;
  accessTokenB: string | null;
  primaryColorB: string | null;
  secondaryColorB: string | null;
  scoreA: number;
  scoreB: number;
  duration: number; // in seconds
  timeLeft: number;
  timerInterval: NodeJS.Timeout | null;
  status: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  logs: string[];
}

class RoomService {
  private activeRooms = new Map<string, Room>();

  private async getUserSettings(twitchId: string, username: string) {
    try {
      const user = await prismaService.client.user.upsert({
        where: { id: twitchId },
        update: { username, displayName: username },
        create: {
          id: twitchId,
          username,
          displayName: username,
          settings: {
            create: {} // Utilise les valeurs par défaut du schéma
          }
        },
        include: { settings: true }
      });
      return user.settings;
    } catch (err) {
      console.error('[RoomService] Erreur DB getUserSettings:', err);
      return { primaryColor: '#00f0ff', secondaryColor: '#ff007f' }; // Fallback
    }
  }

  public async createRoom(durationMinutes: number, streamerA: string, twitchIdA: string, accessTokenA: string): Promise<Room> {
    const settings = await this.getUserSettings(twitchIdA, streamerA);

    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    const newRoom: Room = {
      id: roomId,
      streamerA,
      twitchIdA,
      accessTokenA,
      primaryColorA: settings?.primaryColor || '#00f0ff',
      secondaryColorA: settings?.secondaryColor || '#ff007f',
      streamerB: null,
      twitchIdB: null,
      accessTokenB: null,
      primaryColorB: null,
      secondaryColorB: null,
      scoreA: 0,
      scoreB: 0,
      duration: durationMinutes * 60,
      timeLeft: durationMinutes * 60,
      timerInterval: null,
      status: 'WAITING',
      logs: []
    };
    
    this.activeRooms.set(roomId, newRoom);
    return newRoom;
  }

  public getRoom(roomId: string): Room | undefined {
    return this.activeRooms.get(roomId);
  }

  public addLog(roomId: string, message: string): void {
    const room = this.activeRooms.get(roomId);
    if (!room) return;
    
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formattedMessage = `[${timestamp}] ${message}`;
    
    room.logs.unshift(formattedMessage);
    if (room.logs.length > 50) {
      room.logs.pop();
    }
  }

  public updateScore(roomId: string, streamerLogin: string, delta: number): void {
    const room = this.activeRooms.get(roomId);
    if (!room || room.status !== 'IN_PROGRESS') return;

    if (room.streamerA === streamerLogin) {
      room.scoreA = Math.max(0, room.scoreA + delta);
    } else if (room.streamerB === streamerLogin) {
      room.scoreB = Math.max(0, room.scoreB + delta);
    }
    
    const actionStr = delta > 0 ? `+${delta}` : `${delta}`;
    this.addLog(roomId, `[ADMIN] Le créateur a appliqué ${actionStr} pts à ${streamerLogin}`);
  }

  public addTime(roomId: string, seconds: number): void {
    const room = this.activeRooms.get(roomId);
    if (!room || room.status !== 'IN_PROGRESS') return;

    room.timeLeft += seconds;
    room.duration += seconds; // On étend aussi la durée totale pour ne pas casser des calculs potentiels
    this.addLog(roomId, `[ADMIN] Le créateur a ajouté ${seconds} secondes au chronomètre`);
  }

  public async joinRoom(roomId: string, username: string, twitchId: string, accessToken: string): Promise<Room | null> {
    const room = this.activeRooms.get(roomId);
    if (!room) return null;

    const settings = await this.getUserSettings(twitchId, username);

    if (!room.streamerA) {
      room.streamerA = username;
      room.twitchIdA = twitchId;
      room.accessTokenA = accessToken;
      room.primaryColorA = settings?.primaryColor || '#00f0ff';
      room.secondaryColorA = settings?.secondaryColor || '#ff007f';
    } else if (!room.streamerB && room.streamerA !== username) {
      room.streamerB = username;
      room.twitchIdB = twitchId;
      room.accessTokenB = accessToken;
      room.primaryColorB = settings?.primaryColor || '#00f0ff';
      room.secondaryColorB = settings?.secondaryColor || '#ff007f';
    }

    return room;
  }

  public startRoom(
    roomId: string, 
    onTick: (timeLeft: number) => void, 
    onEnd: () => void
  ): Room | null {
    const room = this.activeRooms.get(roomId);
    if (!room || room.status === 'IN_PROGRESS') return null;

    room.status = 'IN_PROGRESS';

    room.timerInterval = setInterval(() => {
      room.timeLeft -= 1;
      
      onTick(room.timeLeft);

      if (room.timeLeft <= 0) {
        this.endRoom(roomId);
        onEnd();
      }
    }, 1000);

    return room;
  }
  public cancelRoom(roomId: string): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.status = 'ENDED';
      room.logs.push(`[${new Date().toLocaleTimeString('fr-FR')}] Match annulé par le créateur.`);
      // We keep it in memory for a while so viewers can see it ended, but it won't be saved to DB.
    }
  }
  public async endRoom(roomId: string): Promise<void> {
    const room = this.activeRooms.get(roomId);
    if (!room) return;

    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    
    room.status = 'ENDED';
    room.timeLeft = 0;
    
    this.addLog(roomId, `[SYSTEM] Match terminé. Nettoyage mémoire prévu dans 5 minutes.`);

    try {
      if (room.streamerA && room.streamerB && room.twitchIdA && room.twitchIdB) {
        let vainqueurId = "DRAW";
        if (room.scoreA > room.scoreB) vainqueurId = room.twitchIdA;
        if (room.scoreB > room.scoreA) vainqueurId = room.twitchIdB;

        await prismaService.client.matchHistory.create({
          data: {
            streamerAId: room.twitchIdA,
            streamerBId: room.twitchIdB,
            scoreFinalA: room.scoreA,
            scoreFinalB: room.scoreB,
            vainqueurId
          }
        });
        console.log(`[RoomService] Match ${roomId} archivé avec succès en base de données.`);
      }
    } catch (error) {
      console.error(`[RoomService] Erreur lors de l'archivage du match ${roomId}:`, error);
    }

    // Garbage Collection programmé dans 5 minutes (300,000 ms)
    setTimeout(() => {
      this.cleanupRoom(roomId);
    }, 5 * 60 * 1000);
  }

  private async cleanupRoom(roomId: string): Promise<void> {
    const room = this.activeRooms.get(roomId);
    if (!room) return;

    console.log(`[Garbage Collection] Nettoyage en cours pour la salle ${roomId}`);
    
    // Purge de la base de données Redis (Votes)
    const redis = redisService.getClient();
    const redisKey = `room:${roomId}:votes`;
    try {
      await redis.del(redisKey);
      console.log(`[Garbage Collection] Clé Redis ${redisKey} supprimée avec succès.`);
    } catch (err) {
      console.error(`[Garbage Collection] Erreur lors de la suppression Redis de ${redisKey}`, err);
    }

    // Suppression en mémoire Node.js
    this.activeRooms.delete(roomId);
    console.log(`[Garbage Collection] Salle ${roomId} retirée de la mémoire serveur.`);
  }
}

// Export singleton
export const roomService = new RoomService();
