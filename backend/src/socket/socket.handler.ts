import { Server, Socket } from 'socket.io';
import { roomService } from '../services/room.service';
import { TwitchEventSubService } from '../services/twitch.service';

let ioInstance: Server | null = null;
const eventSubInstances = new Map<string, TwitchEventSubService>();

const getSafeRoom = (room: any) => {
  if (!room) return null;
  const { timerInterval, ...safeRoom } = room;
  return safeRoom;
};

export const getIO = () => {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
};

export const setupSocketHandler = (io: Server) => {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);

    socket.on('CREATE_ROOM', async (data: { durationMinutes: number, streamerLogin: string, twitchId: string, accessToken: string }, callback) => {
      try {
        const room = await roomService.createRoom(data.durationMinutes, data.streamerLogin, data.twitchId, data.accessToken);
        socket.join(room.id);
        
        console.log(`[Socket] Room created: ${room.id} by ${data.streamerLogin}`);
        
        if (typeof callback === 'function') {
          callback({ success: true, roomId: room.id, room: getSafeRoom(room) });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('JOIN_ROOM', async (data: { roomId: string, streamerLogin: string, twitchId: string, accessToken: string }, callback) => {
      try {
        const room = await roomService.joinRoom(data.roomId, data.streamerLogin, data.twitchId, data.accessToken);
        
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
          return;
        }

        socket.join(data.roomId);
        io.to(data.roomId).emit('ROOM_STATE_UPDATE', { room: getSafeRoom(room) });
        
        console.log(`[Socket] User ${data.streamerLogin} joined room: ${data.roomId}`);
        
        if (typeof callback === 'function') {
          callback({ success: true, room: getSafeRoom(room) });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('SPECTATE_ROOM', (data: { roomId: string }, callback) => {
      try {
        const room = roomService.getRoom(data.roomId);
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
          return;
        }
        
        // Join the room without modifying the streamer slots
        socket.join(data.roomId);
        console.log(`[Socket] Spectator (OBS) joined room: ${data.roomId}`);
        
        if (typeof callback === 'function') {
          callback({ success: true, room: getSafeRoom(room) });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('START_MATCH', (data: { roomId: string }, callback) => {
      try {
        const room = roomService.getRoom(data.roomId);
        if (!room || room.status === 'IN_PROGRESS') {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found or already started' });
          return;
        }

        roomService.startRoom(
          data.roomId,
          (timeLeft) => {
            io.to(data.roomId).emit('TIMER_TICK', { timeLeft });
          },
          () => {
            io.to(data.roomId).emit('TIMER_TICK', { timeLeft: 0 });
            
            // On End, determine winner
            const finalRoom = roomService.getRoom(data.roomId);
            const winner = finalRoom && finalRoom.scoreA > finalRoom.scoreB ? finalRoom.streamerA : 
                           finalRoom && finalRoom.scoreB > finalRoom.scoreA ? finalRoom.streamerB : 'DRAW';

            io.to(data.roomId).emit('MATCH_ENDED', { winner });

            // Cleanup EventSub connections
            const esA = eventSubInstances.get(`${data.roomId}_A`);
            if (esA) esA.disconnect();
            const esB = eventSubInstances.get(`${data.roomId}_B`);
            if (esB) esB.disconnect();
          }
        );

        // Start EventSub connections for both streamers
        if (room.accessTokenA && room.twitchIdA && room.streamerA) {
          const esA = new TwitchEventSubService(room.accessTokenA, room.twitchIdA, room.id, room.streamerA);
          esA.connect();
          eventSubInstances.set(`${room.id}_A`, esA);
        }
        
        if (room.accessTokenB && room.twitchIdB && room.streamerB) {
          const esB = new TwitchEventSubService(room.accessTokenB, room.twitchIdB, room.id, room.streamerB);
          esB.connect();
          eventSubInstances.set(`${room.id}_B`, esB);
        }

        // Broadcast initial start
        io.to(data.roomId).emit('ROOM_STATE_UPDATE', { room: getSafeRoom(room) });
        
        if (typeof callback === 'function') {
          callback({ success: true, message: 'Match started' });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('MANUAL_SCORE_UPDATE', (data: { roomId: string, streamerLogin: string, delta: number, twitchId: string }, callback) => {
      try {
        const room = roomService.getRoom(data.roomId);
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
          return;
        }

        // Vérification stricte : seul le créateur de la salle (streamerA) peut effectuer cette action
        if (room.twitchIdA !== data.twitchId) {
          console.warn(`[Security] Tentative de triche interceptée (Score) par Twitch ID : ${data.twitchId}`);
          if (typeof callback === 'function') callback({ success: false, message: 'Action non autorisée. Seul le créateur peut faire cela.' });
          return;
        }

        roomService.updateScore(data.roomId, data.streamerLogin, data.delta);
        
        const actionStr = data.delta > 0 ? `+${data.delta}` : `${data.delta}`;
        const message = `Modification de score : ${actionStr} pts à ${data.streamerLogin}`;
        
        io.to(data.roomId).emit('ADMIN_CORRECTION', { message });
        io.to(data.roomId).emit('ROOM_STATE_UPDATE', { room: getSafeRoom(roomService.getRoom(data.roomId)) });

        if (typeof callback === 'function') {
          callback({ success: true, message: 'Score updated' });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('ADD_TIME', (data: { roomId: string, seconds: number, twitchId: string }, callback) => {
      try {
        const room = roomService.getRoom(data.roomId);
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
          return;
        }

        // Vérification stricte : seul le créateur de la salle (streamerA) peut effectuer cette action
        if (room.twitchIdA !== data.twitchId) {
          console.warn(`[Security] Tentative de triche interceptée (Temps) par Twitch ID : ${data.twitchId}`);
          if (typeof callback === 'function') callback({ success: false, message: 'Action non autorisée. Seul le créateur peut faire cela.' });
          return;
        }

        roomService.addTime(data.roomId, data.seconds);
        
        const message = `Ajout de temps : +${data.seconds} secondes`;
        io.to(data.roomId).emit('ADMIN_CORRECTION', { message });
        io.to(data.roomId).emit('ROOM_STATE_UPDATE', { room: getSafeRoom(roomService.getRoom(data.roomId)) });

        if (typeof callback === 'function') {
          callback({ success: true, message: 'Time added' });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('CANCEL_MATCH', (data: { roomId: string, twitchId: string }, callback) => {
      try {
        const room = roomService.getRoom(data.roomId);
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, message: 'Room not found' });
          return;
        }

        if (room.twitchIdA !== data.twitchId) {
          if (typeof callback === 'function') callback({ success: false, message: 'Action non autorisée. Seul le créateur peut faire cela.' });
          return;
        }

        // Cancel the room (clear interval and delete from redis without saving)
        roomService.cancelRoom(data.roomId);
        
        io.to(data.roomId).emit('MATCH_ENDED', { winner: 'CANCELLED' });

        // Cleanup EventSub connections
        const esA = eventSubInstances.get(`${data.roomId}_A`);
        if (esA) esA.disconnect();
        const esB = eventSubInstances.get(`${data.roomId}_B`);
        if (esB) esB.disconnect();

        if (typeof callback === 'function') {
          callback({ success: true, message: 'Match cancelled' });
        }
      } catch (error) {
        if (typeof callback === 'function') callback({ success: false, message: 'Internal Server Error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });
};
