import WebSocket from 'ws';
import { scoreService } from './score.service';

interface TwitchSubscription {
  type: string;
  version: string;
  condition: any;
}

export class TwitchEventSubService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private accessToken: string;
  private broadcasterId: string;
  private roomId: string;
  private streamerLogin: string;

  constructor(accessToken: string, broadcasterId: string, roomId: string, streamerLogin: string) {
    this.accessToken = accessToken;
    this.broadcasterId = broadcasterId;
    this.roomId = roomId;
    this.streamerLogin = streamerLogin;
  }

  public connect(): void {
    this.ws = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

    this.ws.on('open', () => {
      console.log(`[EventSub] Connected for streamer ${this.streamerLogin} (Room ${this.roomId})`);
    });

    this.ws.on('message', async (data: string) => {
      const message = JSON.parse(data);

      if (message.metadata.message_type === 'session_welcome') {
        this.sessionId = message.payload.session.id;
        console.log(`[EventSub] Session Welcome received. ID: ${this.sessionId}`);
        await this.subscribeToEvents();
      }

      if (message.metadata.message_type === 'notification') {
        await this.handleNotification(message.payload);
      }
      
      if (message.metadata.message_type === 'session_keepalive') {
        // Keep-alive reçu, tout va bien
      }
    });

    this.ws.on('close', () => {
      console.log(`[EventSub] Disconnected for streamer ${this.streamerLogin}`);
    });

    this.ws.on('error', (err) => {
      console.error(`[EventSub] WebSocket Error for ${this.streamerLogin}:`, err);
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async subscribeToEvents(): Promise<void> {
    if (!this.sessionId) return;

    const subscriptions: TwitchSubscription[] = [
      {
        type: 'channel.chat.message',
        version: '1',
        condition: { broadcaster_user_id: this.broadcasterId, user_id: this.broadcasterId } // Requiert user_id identique au broadcaster pour lire le chat via User Token
      },
      {
        type: 'channel.cheer',
        version: '1',
        condition: { broadcaster_user_id: this.broadcasterId }
      },
      {
        type: 'channel.subscribe',
        version: '1',
        condition: { broadcaster_user_id: this.broadcasterId }
      },
      {
        type: 'channel.subscription.gift',
        version: '1',
        condition: { broadcaster_user_id: this.broadcasterId }
      }
    ];

    for (const sub of subscriptions) {
      try {
        const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
          method: 'POST',
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID || '',
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: sub.type,
            version: sub.version,
            condition: sub.condition,
            transport: {
              method: 'websocket',
              session_id: this.sessionId
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          console.error(`[EventSub] Failed to subscribe to ${sub.type}:`, errData);
        } else {
          console.log(`[EventSub] Successfully subscribed to ${sub.type}`);
        }
      } catch (err) {
        console.error(`[EventSub] Error subscribing to ${sub.type}:`, err);
      }
    }
  }

  private async handleNotification(payload: any): Promise<void> {
    const event = payload.event;
    const subscriptionType = payload.subscription.type;

    // Importing dynamically to avoid circular issues if any, but since we are logging:
    const { roomService } = await import('./room.service');

    if (subscriptionType === 'channel.chat.message') {
      const messageText = event.message?.text || '';
      if (messageText.trim().toLowerCase() === '!duel') {
        const userId = event.chatter_user_id;
        const chatterName = event.chatter_user_name || 'Un viewer';
        const voted = await scoreService.processChatVote(this.roomId, this.streamerLogin, userId);
        if (voted) {
          roomService.addLog(this.roomId, `${chatterName} a voté !duel (+10 pts) pour ${this.streamerLogin}`);
          this.broadcastScoreUpdate();
        }
      }
    } else if (subscriptionType === 'channel.cheer') {
      const bits = event.bits;
      const userName = event.user_name || 'Anonyme';
      scoreService.processBits(this.roomId, this.streamerLogin, bits);
      roomService.addLog(this.roomId, `${userName} a envoyé ${bits} Bits (+${bits} pts) pour ${this.streamerLogin}`);
      this.broadcastScoreUpdate();
    } else if (subscriptionType === 'channel.subscribe') {
      const tier = event.tier;
      const userName = event.user_name || 'Anonyme';
      const pts = scoreService.processSubscription(this.roomId, this.streamerLogin, tier);
      roomService.addLog(this.roomId, `${userName} s'est abonné (Tier ${tier === '1000' ? 1 : tier === '2000' ? 2 : 3}) pour ${this.streamerLogin}`);
      this.broadcastScoreUpdate();
    } else if (subscriptionType === 'channel.subscription.gift') {
      const tier = event.tier;
      const totalGifts = event.total;
      const userName = event.user_name || 'Anonyme';
      for (let i = 0; i < totalGifts; i++) {
         scoreService.processSubscription(this.roomId, this.streamerLogin, tier);
      }
      roomService.addLog(this.roomId, `${userName} a offert ${totalGifts} abonnements pour ${this.streamerLogin}`);
      this.broadcastScoreUpdate();
    }
  }

  private broadcastScoreUpdate() {
    import('../socket/socket.handler').then(({ getIO }) => {
       const ioInstance = getIO();
       import('./room.service').then(({ roomService }) => {
          const room = roomService.getRoom(this.roomId);
          if (room) {
             ioInstance.to(this.roomId).emit('ROOM_STATE_UPDATE', { room });
          }
       });
    });
  }
}
