"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ArrowLeft, Swords, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";
import { getArenaSocket, disconnectArenaSocket } from "@/lib/arenaSocket";
import type { School, Course } from "@/lib/types/entities";

type MatchStatus = "idle" | "searching";

function getDisplayName(user: { user_metadata?: { display_name?: string; full_name?: string }; email?: string } | null): string {
  if (!user) return "Student";
  const meta = user.user_metadata;
  return (meta?.display_name || meta?.full_name || user.email || "Student") as string;
}

export default function ArenaPage() {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [weekNumber, setWeekNumber] = useState(1);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("idle");

  const { data: meData } = useQuery({ queryKey: ["auth", "me"], queryFn: () => api.auth.me() });
  const playerName = getDisplayName(meData?.user ?? null);

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.entities.School.list(),
  });
  const { data: allCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.entities.Course.list(),
  });
  const courses = selectedSchool
    ? (allCourses as Course[]).filter((c) => c.school_id === selectedSchool.id)
    : [];

  const canFindBattle = !!selectedCourse && weekNumber >= 1 && weekNumber <= 12;

  const handleFindBattle = () => {
    if (!selectedCourse || !canFindBattle) return;
    setMatchStatus("searching");
    const socket = getArenaSocket();
    socket.emit("join_queue", {
      courseId: selectedCourse.id,
      weekNumber,
      playerName,
    });
    socket.once("match_found", (data: { roomId: string; role: "player1" | "player2"; opponentName?: string }) => {
      const player = data.role === "player1" ? "pikachu" : "charmander";
      const opponentName = data.opponentName ?? "Opponent";
      const params = new URLSearchParams({
        roomId: data.roomId,
        player,
        courseId: selectedCourse.id,
        weekNumber: String(weekNumber),
        myName: playerName,
        opponentName,
      });
      router.push(`/GameFight?${params.toString()}`);
    });
    socket.once("game_error", () => {
      setMatchStatus("idle");
      alert("Could not start game. Try again.");
    });
  };

  const handleBack = () => {
    disconnectArenaSocket();
    setMatchStatus("idle");
    router.push("/Dashboard");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <>
          <div className="flex items-center justify-between p-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-[#4a2b3e] hover:bg-[#ffe6f0]/60 font-semibold border border-[#ffb3c6] bg-white/60"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            </div>

            <h1 className="text-6xl font-black text-[#4a2b3e] tracking-tight text-center pt-6 pb-6">Arena</h1>
            
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full rounded-2xl border-2 border-[#ffd6e8] bg-white/90 backdrop-blur-xl p-6 shadow-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Swords className="w-6 h-6 text-[#ff8fb1]" />
                  <h2 className="text-xl font-bold text-[#4a2b3e]">Find a battle</h2>
                </div>
                <p className="text-sm text-[#8b5a7a] mb-4">Choose course and week, then find an opponent.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#b66d94] uppercase mb-1">University</label>
                    <select
                      value={selectedSchool?.id ?? ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedSchool(schools.find((s) => s.id === id) ?? null);
                        setSelectedCourse(null);
                      }}
                      className="w-full rounded-xl border-2 border-[#ffd6e8] bg-white px-3 py-2 text-[#4a2b3e] font-medium"
                    >
                      <option value="">Select university</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#b66d94] uppercase mb-1">Course</label>
                    <select
                      value={selectedCourse?.id ?? ""}
                      onChange={(e) => {
                        const c = courses.find((x) => x.id === e.target.value) ?? null;
                        setSelectedCourse(c);
                      }}
                      className="w-full rounded-xl border-2 border-[#ffd6e8] bg-white px-3 py-2 text-[#4a2b3e] font-medium"
                      disabled={!selectedSchool}
                    >
                      <option value="">Select course</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#b66d94] uppercase mb-1">Week</label>
                    <select
                      value={weekNumber}
                      onChange={(e) => setWeekNumber(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border-2 border-[#ffd6e8] bg-white px-3 py-2 text-[#4a2b3e] font-medium"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w}>Week {w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleFindBattle}
                  disabled={!canFindBattle || matchStatus === "searching"}
                  className="w-full mt-6 py-6 bg-gradient-to-r from-[#ff8fb1] to-[#ff6b8a] hover:from-[#ff9bb8] hover:to-[#ff7a96] text-white font-bold rounded-xl shadow-lg disabled:opacity-60"
                >
                  {matchStatus === "searching" ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Searching for opponent…
                    </>
                  ) : (
                    <>
                      <Swords className="w-5 h-5 mr-2" />
                      Find Battle
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
        </>
      </div>
    </div>
  );
}
