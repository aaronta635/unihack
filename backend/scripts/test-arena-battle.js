/**
 * Test full battle flow: matchmaking -> game_start -> turn_start -> submit_answer -> submit_action -> game_over.
 * Run once; creates two socket clients (Alice & Bob), matches them, then Alice answers correctly and attacks.
 *
 * Usage: node scripts/test-arena-battle.js
 * (Backend must be running; ensure course-comp2000 week 1 has questions in DB.)
 */

const { io } = require('socket.io-client');

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

function connect(name) {
  return new Promise((resolve) => {
    const socket = io(url, { path: '/arena-socket', transports: ['websocket', 'polling'] });
    socket.on('connect', () => resolve(socket));
  });
}

function run() {
  return (async () => {
    const alice = await connect('Alice');
    const bob = await connect('Bob');

    let aliceRoomId, aliceRole;
    let bobRoomId, bobRole;

    alice.on('match_found', (d) => {
      aliceRoomId = d.roomId;
      aliceRole = d.role;
      console.log('[Alice] match_found', d.role, d.roomId);
    });
    bob.on('match_found', (d) => {
      bobRoomId = d.roomId;
      bobRole = d.role;
      console.log('[Bob] match_found', d.role, d.roomId);
    });

    alice.emit('join_queue', {
      courseId: 'course-comp2000',
      weekNumber: 1,
      playerName: 'Alice',
    });
    bob.emit('join_queue', {
      courseId: 'course-comp2000',
      weekNumber: 1,
      playerName: 'Bob',
    });

    alice.on('game_start', (d) => console.log('[Alice] game_start', d));
    bob.on('game_start', (d) => console.log('[Bob] game_start', d));

    alice.on('turn_start', (d) => {
      console.log('[Alice] turn_start', d.turnOwner, d.question?.question?.slice(0, 40) + '...');
      if (d.turnOwner === 'player1') {
        setTimeout(() => {
          const correctIndex = d.question?.correct_index ?? 0;
          console.log('[Alice] submit_answer', correctIndex);
          alice.emit('submit_answer', { roomId: aliceRoomId, optionIndex: correctIndex });
        }, 500);
      }
    });
    bob.on('turn_start', (d) => {
      console.log('[Bob] turn_start', d.turnOwner, d.question?.question?.slice(0, 40) + '...');
      if (d.turnOwner === 'player2') {
        setTimeout(() => {
          const correctIndex = d.question?.correct_index ?? 0;
          console.log('[Bob] submit_answer', correctIndex);
          bob.emit('submit_answer', { roomId: bobRoomId, optionIndex: correctIndex });
        }, 500);
      }
    });

    alice.on('your_turn_action', (d) => {
      console.log('[Alice] your_turn_action -> submit_action attack');
      alice.emit('submit_action', { roomId: aliceRoomId, actionId: 'attack' });
    });
    bob.on('your_turn_action', (d) => {
      console.log('[Bob] your_turn_action -> submit_action attack');
      bob.emit('submit_action', { roomId: bobRoomId, actionId: 'attack' });
    });

    alice.on('action_result', (d) => console.log('[Alice] action_result', d));
    bob.on('action_result', (d) => console.log('[Bob] action_result', d));

    alice.on('game_over', (d) => {
      console.log('[Alice] game_over', d);
      alice.close();
      bob.close();
      process.exit(0);
    });
    bob.on('game_over', (d) => {
      console.log('[Bob] game_over', d);
    });

    alice.on('game_error', (e) => {
      console.error('[Alice] game_error', e?.message || e);
      alice.close();
      bob.close();
      process.exit(1);
    });
    bob.on('game_error', (e) => {
      console.error('[Bob] game_error', e?.message || e);
      alice.close();
      bob.close();
      process.exit(1);
    });

    setTimeout(() => {
      console.log('Timeout 30s - exiting');
      alice.close();
      bob.close();
      process.exit(0);
    }, 30000);
  })();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
