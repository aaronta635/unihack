"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";
import GameCanvasFight from "@/components/game/GameCanvasFight";
import { disconnectArenaSocket } from "@/lib/arenaSocket";

export default function GameFightPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const weekNumber = searchParams.get("weekNumber") ? parseInt(searchParams.get("weekNumber") ?? "0", 10) : null;
  const roomId = searchParams.get("roomId") ?? undefined;
  const playerParam = searchParams.get("player");
  /** First player (from Arena) = Pikachu; second = Charmander. */
  const role = playerParam === "charmander" ? "charmander" : "pikachu";
  const myName = searchParams.get("myName") ?? (role === "charmander" ? "Charmander" : "Pikachu");
  const opponentName = searchParams.get("opponentName") ?? (role === "charmander" ? "Pikachu" : "Charmander");
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? undefined;
  const isArenaMatch = !!roomId;
  const [showControlsHint, setShowControlsHint] = useState(true);
  const playerModelUrl =
    process.env.NEXT_PUBLIC_PLAYER_MODEL_URL ?? "/model.obj";

  useEffect(() => {
    const t = setTimeout(() => setShowControlsHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleOpponentLeftArena = useCallback(() => {
    disconnectArenaSocket();
    router.push("/Arena");
  }, [router]);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden flex flex-col min-w-0 min-h-0">
      <AnimeBackground />
      <div className="absolute inset-0 flex flex-col min-w-0 min-h-0">
        <GameCanvasFight
          playerModelUrl={playerModelUrl}
          courseId={courseId ?? undefined}
          weekNumber={weekNumber ?? undefined}
          roomId={roomId}
          wsUrl={wsUrl}
          role={role}
          playerName={myName}
          opponentName={opponentName}
          onOpponentLeftArena={isArenaMatch ? handleOpponentLeftArena : undefined}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { disconnectArenaSocket(); router.push("/Dashboard"); }}
                title="Back to Dashboard"
                aria-label="Back to Dashboard"
                className="shrink-0 w-10 h-10 rounded-xl text-white bg-slate-900/60 hover:bg-slate-800/80 border border-pink-500/30 backdrop-blur-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              {isArenaMatch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { disconnectArenaSocket(); router.push("/Arena"); }}
                  title="Find another battle"
                  className="shrink-0 rounded-xl text-white bg-slate-900/60 hover:bg-slate-800/80 border border-pink-500/30 backdrop-blur-xl text-xs font-semibold px-3 py-2"
                >
                  <Swords className="w-4 h-4 mr-1.5 inline" />
                  Find another battle
                </Button>
              )}
            </div>
            {showControlsHint && (
              <div className="bg-slate-900/60 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-amber-500/30 pointer-events-auto">
                <p className="text-amber-200 text-xs font-semibold">
                  {isArenaMatch
                    ? (role === "charmander" ? "You control Charmander — WASD to move" : "You control Pikachu — WASD to move")
                    : role === "charmander"
                      ? "2P: You control Charmander — WASD to move"
                      : "Battle Demo — WASD to move (Pikachu)"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
