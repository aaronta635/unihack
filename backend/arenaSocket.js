/**
 * Arena WebSocket: matchmaking and battle room state.
 * Attach to HTTP server from bin/www.
 */

const { Server } = require('socket.io');
const { getSupabase } = require('./supabaseClient');

/** Queue key: "courseId:weekNumber" -> array of { socketId, socket, playerName } */
const waitingByKey = new Map();
/** roomId -> battle room state */
const rooms = new Map();
let nextRoomId = 1;

const MAX_HEALTH = 100;
const DAMAGE = { attack: 15, skill1: 25, skill2: 20 };

function getQueueKey(courseId, weekNumber) {
  return `${String(courseId || '').trim()}:${Number(weekNumber) || 1}`;
}

async function fetchQuestionsForRoom(courseId, weekNumber) {
  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from('questions')
    .select('id, title, choice1, choice2, choice3, choice4, answer')
    .eq('course_id', courseId)
    .eq('week_number', weekNumber)
    .order('id', { ascending: true });

  if (error) throw error;
  return (rows || []).map((r) => ({
    question: r.title || '',
    options: [r.choice1 || '', r.choice2 || '', r.choice3 || '', r.choice4 || ''],
    correct_index: Math.max(0, Math.min(3, (r.answer || 1) - 1)),
  }));
}

function startGameInRoom(io, roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.questions || room.questions.length === 0) {
    console.log('[Arena] No questions for room', roomId);
    io.to(roomId).emit('game_error', { message: 'No questions for this course/week.' });
    rooms.delete(roomId);
    return;
  }

  room.phase = 'question';
  room.turnOwner = 'player1';
  room.questionIndex = 0;

  io.to(roomId).emit('game_start', {
    roomId,
    health1: room.health1,
    health2: room.health2,
  });

  const q = room.questions[room.questionIndex];
  io.to(roomId).emit('turn_start', {
    turnOwner: room.turnOwner,
    question: q,
    questionIndex: room.questionIndex,
  });
}

function nextTurn(io, roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.phase = 'question';
  room.turnOwner = room.turnOwner === 'player1' ? 'player2' : 'player1';
  room.questionIndex = (room.questionIndex + 1) % room.questions.length;
  const q = room.questions[room.questionIndex];

  io.to(roomId).emit('turn_start', {
    turnOwner: room.turnOwner,
    question: q,
    questionIndex: room.questionIndex,
  });
}

function getRole(room, socketId) {
  if (room.player1SocketId === socketId) return 'player1';
  if (room.player2SocketId === socketId) return 'player2';
  return null;
}

function attachArenaSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: true },
    path: '/arena-socket',
  });

  io.on('connection', (socket) => {
    socket.on('join_queue', async (data) => {
      const courseId = (data && data.courseId) != null ? String(data.courseId).trim() : '';
      const weekNumber = Math.max(1, parseInt(data?.weekNumber, 10) || 1);
      const playerName = (data && data.playerName) != null ? String(data.playerName).trim() : 'Player';

      const key = getQueueKey(courseId, weekNumber);
      if (!waitingByKey.has(key)) waitingByKey.set(key, []);

      const queue = waitingByKey.get(key);
      queue.push({
        socketId: socket.id,
        socket,
        playerName,
        courseId,
        weekNumber,
      });

      if (queue.length >= 2) {
        const [a, b] = queue.splice(0, 2);
        if (queue.length === 0) waitingByKey.delete(key);

        const roomId = `room-${nextRoomId++}`;
        a.socket.join(roomId);
        b.socket.join(roomId);

        const room = {
          player1SocketId: a.socketId,
          player2SocketId: b.socketId,
          courseId: a.courseId,
          weekNumber: a.weekNumber,
          health1: MAX_HEALTH,
          health2: MAX_HEALTH,
          questions: null,
          questionIndex: 0,
          turnOwner: 'player1',
          phase: 'question',
        };
        rooms.set(roomId, room);

        a.socket.emit('match_found', {
          roomId,
          role: 'player1',
          opponentName: b.playerName,
        });
        b.socket.emit('match_found', {
          roomId,
          role: 'player2',
          opponentName: a.playerName,
        });

        try {
          console.log('[Arena] Fetching questions for', room.courseId, 'week', room.weekNumber);
          room.questions = await fetchQuestionsForRoom(room.courseId, room.weekNumber);
          console.log('[Arena] Got', room.questions?.length ?? 0, 'questions, starting game');
          startGameInRoom(io, roomId);
        } catch (err) {
          console.error('[Arena] Fetch questions failed', err.message || err);
          io.to(roomId).emit('game_error', { message: 'Failed to load questions.' });
          rooms.delete(roomId);
        }
      }
    });

    socket.on('submit_answer', (data) => {
      const roomId = data && data.roomId ? String(data.roomId).trim() : null;
      const optionIndex = data && data.optionIndex != null ? parseInt(data.optionIndex, 10) : -1;
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.phase !== 'question') return;

      const role = getRole(room, socket.id);
      if (!role || room.turnOwner !== role) return;

      const q = room.questions[room.questionIndex];
      const correct = q && q.correct_index === optionIndex;

      if (correct) {
        room.phase = 'action';
        socket.emit('your_turn_action', { roomId });
      } else {
        io.to(roomId).emit('wrong_answer', { turnOwner: room.turnOwner });
        nextTurn(io, roomId);
      }
    });

    socket.on('submit_action', (data) => {
      const roomId = data && data.roomId ? String(data.roomId).trim() : null;
      const actionId = (data && data.actionId) ? String(data.actionId) : 'attack';
      if (!roomId) return;

      const room = rooms.get(roomId);
      if (!room || room.phase !== 'action') return;

      const role = getRole(room, socket.id);
      if (!role) return;

      const damage = DAMAGE[actionId] != null ? DAMAGE[actionId] : DAMAGE.attack;
      if (role === 'player1') {
        room.health2 = Math.max(0, room.health2 - damage);
      } else {
        room.health1 = Math.max(0, room.health1 - damage);
      }

      io.to(roomId).emit('action_result', {
        fromRole: role,
        actionId,
        damage,
        health1: room.health1,
        health2: room.health2,
      });

      if (room.health1 <= 0 || room.health2 <= 0) {
        const winner = room.health1 <= 0 ? 'player2' : 'player1';
        io.to(roomId).emit('game_over', {
          winner,
          health1: room.health1,
          health2: room.health2,
        });
        rooms.delete(roomId);
        return;
      }

      nextTurn(io, roomId);
    });

    socket.on('disconnect', () => {
      for (const [key, queue] of waitingByKey.entries()) {
        const idx = queue.findIndex((e) => e.socketId === socket.id);
        if (idx !== -1) {
          queue.splice(idx, 1);
          if (queue.length === 0) waitingByKey.delete(key);
          break;
        }
      }
      for (const [roomId, room] of rooms.entries()) {
        if (room.player1SocketId === socket.id || room.player2SocketId === socket.id) {
          socket.to(roomId).emit('opponent_left', { roomId });
          rooms.delete(roomId);
          break;
        }
      }
    });
  });

  return io;
}

module.exports = { attachArenaSocket, getQueueKey, rooms };
