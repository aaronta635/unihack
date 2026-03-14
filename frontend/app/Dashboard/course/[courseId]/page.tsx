"use client";

import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";
import Leaderboard from "@/components/dashboard/Leaderboard";
import WeekSelector from "@/components/dashboard/WeekSelector";

type Course = {
  id: string;
  code: string;
  title: string;
  weeks?: { week_number: number; title?: string; tutorial_url?: string; questions?: unknown[] }[];
};
type Score = {
  id: string;
  player_name: string;
  course_id?: string;
  course_title?: string;
  week_number?: number;
  score: number;
  total_questions?: number;
};

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const {
    data: courseList = [],
    isLoading: courseLoading,
    isFetched: courseFetched,
  } = useQuery({
    queryKey: ["courses-list", courseId],
    queryFn: async () => {
      const all = (await api.entities.Course.list()) as Course[];
      const id = String(courseId ?? "").trim();
      if (!id) return [];
      const found =
        all.find(
          (c) =>
            c.id === id ||
            c.id === `course-${id}` ||
            c.code === id ||
            c.code === id.toUpperCase()
        ) ?? null;
      return found ? [found] : [];
    },
    enabled: !!courseId?.trim(),
  });
  const course = (courseList[0] as Course | undefined) ?? null;

  const { data: allScores = [] } = useQuery({
    queryKey: ["scores"],
    queryFn: () => api.entities.Score.list("-score", 100),
  });
  const scoresForCourse = (allScores as Score[]).filter(
    (s) =>
      s.course_id === courseId ||
      (course != null && s.course_title === course.code)
  );

  const handleStartGame = (
    c: { id: string; code?: string; title?: string },
    weekData: { week_number: number }
  ) => {
    const params = new URLSearchParams({
      courseId: c.id,
      courseTitle: c.title ?? "",
      courseCode: c.code ?? "",
      weekNumber: String(weekData.week_number),
    });
    router.push(`/GamePlay?${params.toString()}`);
  };

  if (courseLoading || !courseId?.trim() || (!courseFetched && !course)) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <AnimeBackground />
        <div className="relative z-10 text-slate-700 font-semibold">
          Loading...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center gap-4">
        <AnimeBackground />
        <div className="relative z-10 text-slate-700 font-semibold">
          Course not found
        </div>
        <Button
          onClick={() => router.push("/Dashboard")}
          className="relative z-10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  const courseData = course;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimeBackground />
      <div className="relative z-10">
        <div className="flex items-center justify-between p-4 md:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/Dashboard")}
            className="text-slate-700 hover:text-slate-900 hover:bg-white/40 font-semibold border-2 border-slate-300"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black text-slate-800">{courseData.code}</h1>
              <p className="text-xs text-slate-600 font-semibold truncate max-w-[180px]">
                {courseData.title}
              </p>
            </div>
          </div>
        </div>
        <div className="p-4 md:px-8 md:pb-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-xl"
            >
              <Leaderboard scores={scoresForCourse} />
            </motion.section>
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/95 backdrop-blur-xl border-2 border-slate-200 rounded-2xl p-6 shadow-xl"
            >
              <WeekSelector
                course={courseData}
                onStartGame={handleStartGame}
              />
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
