import { redisService } from './redis.service';
import { roomService } from './room.service';

class ScoreService {
  /**
   * Appelé lorsqu'un événement Twitch modifie le score.
   */
  public async addPoints(roomId: string, streamerLogin: string, points: number): Promise<void> {
    const room = roomService.getRoom(roomId);
    if (!room || room.status !== 'IN_PROGRESS') return;

    if (room.streamerA === streamerLogin) {
      room.scoreA += points;
    } else if (room.streamerB === streamerLogin) {
      room.scoreB += points;
    } else {
      return; // Le streamer ne fait pas partie de ce salon
    }

    // Le score a été mis à jour dans la référence mémoire du salon.
    // L'émission Socket.io (`ROOM_STATE_UPDATE`) devra être déclenchée.
    // Pour découpler, nous pourrions utiliser un EventEmitter, mais pour faire simple
    // nous l'appellerons depuis le twitch.service ou via un callback.
  }

  /**
   * Traite un vote chat "!duel".
   * Utilise Redis SADD pour garantir qu'un utilisateur ne vote qu'une seule fois par salon.
   */
  public async processChatVote(roomId: string, streamerLogin: string, userId: string): Promise<boolean> {
    const redis = redisService.getClient();
    const redisKey = `room:${roomId}:votes`;

    try {
      // SADD ajoute l'userId au set. Retourne 1 si ajouté (nouveau vote), 0 si existait déjà (doublon).
      const added = await redis.sAdd(redisKey, userId);

      if (added === 1) {
        // Nouveau vote valide, on ajoute 10 points
        await this.addPoints(roomId, streamerLogin, 10);
        return true;
      }
      return false; // L'utilisateur a déjà voté
    } catch (error) {
      console.error('[ScoreService] Erreur lors de la vérification du doublon de vote', error);
      return false;
    }
  }

  public processBits(roomId: string, streamerLogin: string, bits: number): void {
    // 1 Bit = 1 point
    this.addPoints(roomId, streamerLogin, bits);
  }

  public processSubscription(roomId: string, streamerLogin: string, tier: string): void {
    let points = 0;
    if (tier === '1000') points = 500; // Tier 1
    else if (tier === '2000') points = 800; // Tier 2
    else if (tier === '3000') points = 2000; // Tier 3

    if (points > 0) {
      this.addPoints(roomId, streamerLogin, points);
    }
  }
}

export const scoreService = new ScoreService();
