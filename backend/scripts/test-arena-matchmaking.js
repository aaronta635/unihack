/**
 * Test arena matchmaking: run this script twice (two terminals).
 * Both will join the same queue and should receive match_found.
 *
 * Usage: node scripts/test-arena-matchmaking.js [PlayerName]
 * Example: node scripts/test-arena-matchmaking.js Alice
 *          node scripts/test-arena-matchmaking.js Bob
 *
 * Ensure backend is running first: npm start (or node bin/www)
 */

const { io } = require('socket.io-client');

const port = process.env.PORT || 3000;
const playerName = process.argv[2] || 'Player-' + Math.floor(Math.random() * 1000);
const url = `http://localhost:${port}`;

const socket = io(url, {
  path: '/arena-socket',
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('[%s] Connected, joining queue (course-comp2000, week 1)...', playerName);
  socket.emit('join_queue', {
    courseId: 'course-comp2000',
    weekNumber: 1,
    playerName,
  });
});

socket.on('match_found', (data) => {
  console.log('[%s] MATCH_FOUND:', playerName, data);
  console.log('  -> roomId:', data.roomId, 'role:', data.role, 'opponent:', data.opponentName);
  setTimeout(() => process.exit(0), 500);
});

socket.on('connect_error', (err) => {
  console.error('[%s] Connect error:', playerName, err.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('[%s] Disconnected:', playerName, reason);
});

// Timeout if no match in 30s
setTimeout(() => {
  if (socket.connected) {
    console.log('[%s] No match after 30s, exiting.', playerName);
    socket.close();
    process.exit(0);
  }
}, 30000);
