"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Zap,
  Trophy,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";
import GameCanvas3D from "@/components/game/GameCanvas3D";

export default function GamePlay() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId");
  const courseTitle = searchParams.get("courseTitle");
  const courseCode = searchParams.get("courseCode");
  const weekNumber = parseInt(searchParams.get("weekNumber") ?? "0", 10);

  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "complete">("playing");
  const [finalScore, setFinalScore] = useState({ score: 0, total: 0 });
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [user] = useState({
    full_name: "Demo User",
    email: "demo@studyquest.com",
  });
  const [startTime] = useState(Date.now());

  type CourseData = {
    id: string;
    title?: string;
    code?: string;
    weeks?: { week_number: number; questions?: unknown[] }[];
  };

  const { data: course } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async (): Promise<CourseData | undefined> => {
      const courses = await api.entities.Course.filter({ id: courseId });
      return courses[0] as CourseData | undefined;
    },
    enabled: !!courseId,
  });

  type McqQuestion = {
    question: string;
    options: string[];
    correct_index: number;
  };

  const {
    data: apiQuestions,
    isLoading: questionsLoading,
    isError: questionsError,
  } = useQuery({
    queryKey: ["questions", courseId, weekNumber],
    queryFn: async (): Promise<McqQuestion[]> => {
      if (!courseId || !weekNumber || weekNumber <= 0) return [];
      const base =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(
        `${base}/api/questions?course_id=${encodeURIComponent(
          courseId
        )}&week_number=${weekNumber}`
      );
      if (!res.ok) {
        console.error("Failed to load questions from API", res.status);
        return [];
      }
      const json = await res.json();
      return (json.questions ?? []) as McqQuestion[];
    },
    enabled: !!courseId && weekNumber > 0,
  });

  const weekData = course?.weeks?.find(
    (w: { week_number: number }) => w.week_number === weekNumber
  );
  const questions: McqQuestion[] = (apiQuestions ?? []);

  useEffect(() => {
    if (courseId && questions.length > 0) window.scrollTo(0, 0);
  }, [courseId, questions.length]);

  useEffect(() => {
    const t = setTimeout(() => setShowControlsHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleComplete = async (finalPts: number, totalQ: number) => {
    setFinalScore({ score: finalPts, total: totalQ });
    setGameState("complete");
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    await api.entities.Score.create({
      player_name: user?.full_name || user?.email || "Anonymous",
      player_email: user?.email ?? "",
      course_id: courseId,
      course_title: courseTitle,
      week_number: weekNumber,
      score: finalPts,
      total_questions: totalQ,
      time_taken_seconds: timeTaken,
    });
    await queryClient.invalidateQueries({ queryKey: ["scores"] });
  };

  const handleRestart = () => {
    setScore(0);
    setGameState("playing");
    window.location.reload();
  };

  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimeBackground />
        <div className="relative z-10 text-center">
          <p className="text-white/50 mb-4">No course selected</p>
          <Button
            onClick={() => router.push("/Dashboard")}
            variant="outline"
            className="border-white/20 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen overflow-hidden flex flex-col min-w-0 min-h-0" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
      <AnimeBackground />
      <div className="absolute inset-0 top-0 left-0 flex flex-col min-w-0 min-h-0" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
        {questions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-20 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md text-center mx-auto my-auto"
          >
            <Sparkles className="w-12 h-12 text-yellow-400/50 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              No Questions Yet
            </h2>
            <p className="text-white/40 text-sm mb-6">
              This week doesn&apos;t have any questions configured yet.
            </p>
            <Button
              onClick={() => router.push("/Dashboard")}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white"
            >
              Back to Dashboard
            </Button>
          </motion.div>
        ) : gameState === "playing" ? (
          <>
            {/* Canvas outside any motion.div so position:fixed is viewport-relative (no transform containing block) */}
            <GameCanvas3D
              questions={questions}
              onComplete={handleComplete}
              onScoreUpdate={setScore}
              playerModelUrl={process.env.NEXT_PUBLIC_PLAYER_MODEL_URL ?? "/model.obj"}
              checkpointModelUrl={process.env.NEXT_PUBLIC_CHECKPOINT_MODEL_URL}
            />
            {/* Header and overlays — in motion for animation only; canvas already full-screen above */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 w-full h-full min-w-0 min-h-0 pointer-events-none"
              style={{ pointerEvents: 'none' }}
            >
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2 pointer-events-none">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    courseId
                      ? router.push(`/Dashboard/course/${courseId}`)
                      : router.push("/Dashboard")
                  }
                  title="Back to course"
                  aria-label="Back to course"
                  className="pointer-events-auto shrink-0 w-10 h-10 rounded-xl text-white bg-slate-900/60 hover:bg-slate-800/80 border border-pink-500/30 backdrop-blur-xl shadow-lg shadow-pink-500/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <motion.div
                  className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-full px-4 py-2 border-2 border-yellow-400/40 shadow-xl shadow-yellow-500/20 pointer-events-auto"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  <span className="text-white font-black text-base">{score}</span>
                  <span className="text-yellow-200 text-xs font-bold">POINTS</span>
                </motion.div>
                <div className="text-right bg-slate-900/60 backdrop-blur-xl px-3 py-1.5 rounded-lg border border-purple-500/30 shadow-lg shadow-purple-500/10 pointer-events-auto">
                  <p className="text-white font-bold text-xs">{courseCode}</p>
                  <p className="text-purple-300 text-[10px] font-semibold">
                    Week {weekNumber}
                  </p>
                </div>
              </div>
              {showControlsHint && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-lg text-center pointer-events-none">
                  <p className="text-cyan-200 text-xs font-semibold">
                    WASD to move • SPACE at checkpoints
                  </p>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, rotateY: -30 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 backdrop-blur-xl border-4 border-yellow-400/50 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl shadow-yellow-500/30 relative overflow-hidden"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative z-10"
              >
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  <Trophy className="w-24 h-24 text-yellow-400 relative z-10 drop-shadow-2xl" />
                </div>
              </motion.div>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 mb-3 relative z-10">
                🎉 Quest Complete! 🎉
              </h2>
              <p className="text-white/50 text-sm mb-6">
                {courseCode} • Week {weekNumber}
              </p>
              <div className="bg-gradient-to-r from-slate-800/60 to-slate-900/60 border-2 border-yellow-400/30 rounded-3xl p-8 mb-8 shadow-xl shadow-yellow-500/10 relative z-10">
                <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-2">
                  Your Score
                </p>
                <motion.p
                  className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {finalScore.score}
                </motion.p>
                <p className="text-cyan-300 text-base font-bold mt-3">
                  out of {finalScore.total * 10} points
                </p>
              </div>
              <div className="flex gap-4 relative z-10">
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="flex-1 border-2 border-cyan-400/60 text-white hover:bg-cyan-500/20 bg-slate-800/60 backdrop-blur font-bold py-6"
                >
                  <RotateCcw className="w-5 h-5 mr-2" /> Play Again
                </Button>
                <Button
                  onClick={() => router.push(`/Dashboard/course/${courseId ?? ""}`)}
                  className="flex-1 bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white hover:from-pink-600 hover:via-purple-700 hover:to-indigo-700 font-bold py-6"
                >
                  <Trophy className="w-5 h-5 mr-2" /> Leaderboard
                </Button>
              </div>
            </motion.div>
          </div>
          )}
      </div>
    </div>
  );
}
