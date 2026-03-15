/**
 * Arena WebSocket client for matchmaking and 2-player battle.
 * Connects to the backend Socket.io server at path /arena-socket.
 */

import { io, type Socket } from "socket.io-client";
import { getApiBase } from "@/lib/api/client";

let socket: Socket | null = null;

/**
 * Get or create the arena socket. Call from the client (e.g. when user clicks "Find Battle").
 * Uses NEXT_PUBLIC_API_URL or same host port 3000 for the server URL.
 */
export function getArenaSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getArenaSocket() must be called on the client");
  }
  if (socket) return socket;
  const base = getApiBase();
  socket = io(base, {
    path: "/arena-socket",
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socket;
}

/**
 * Disconnect and clear the arena socket. Call when leaving the arena or after battle.
 */
export function disconnectArenaSocket(): void {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
}

/**
 * Check if we have an active socket (connected or connecting).
 */
export function hasArenaSocket(): boolean {
  return socket != null;
}
