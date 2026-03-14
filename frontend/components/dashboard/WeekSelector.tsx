"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Upload, Play, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type Week = {
  week_number: number;
  title?: string;
  tutorial_url?: string;
  questions?: unknown[];
};

type Course = { id: string; code?: string; weeks?: Week[] };

const WEEK_NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function WeekSelector({
  course,
  onStartGame,
}: {
  course: Course | null;
  onStartGame: (course: Course, weekData: Week) => void;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [weekHasQuestions, setWeekHasQuestions] = useState<
    Record<number, boolean>
  >({});

  const weeks = course?.weeks ?? [];

  useEffect(() => {
    if (!course) {
      setWeekHasQuestions({});
      return;
    }

    const ac = new AbortController();
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    const load = async () => {
      const results = await Promise.all(
        WEEK_NUMBERS.map(async (num) => {
          try {
            const res = await fetch(
              `${base}/api/questions?course_id=${encodeURIComponent(
                course.id
              )}&week_number=${num}`,
              { signal: ac.signal }
            );
            if (!res.ok) return [num, false] as const;
            const json = await res.json().catch(() => ({ questions: [] }));
            const hasQ =
              Array.isArray(json.questions) && json.questions.length > 0;
            return [num, hasQ] as const;
          } catch {
            return [num, false] as const;
          }
        })
      );
      if (!ac.signal.aborted) {
        setWeekHasQuestions(Object.fromEntries(results));
      }
    };

    load();

    return () => ac.abort();
  }, [course?.id]);

  const handleUpload = async (weekNum: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !course) return;
  
      try {
        setUploading(true);
        const base =
          process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
        const formData = new FormData();
        formData.append("file", file);
        formData.append("course_id", course.id);
        formData.append("week_number", String(weekNum));
  
        const res = await fetch(`${base}/upload/pdf`, {
          method: "POST",
          body: formData,
        });
  
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error("Upload failed", res.status, err);
          alert("Failed to upload PDF and generate questions.");
        } else {
          const json = await res.json().catch(() => ({}));
          console.log("Upload OK", json);
          const inserted = json.insertedCount ?? 0;
          if (inserted > 0) {
            setWeekHasQuestions((prev) => ({ ...prev, [weekNum]: true }));
          }
          alert(
            `Questions ready for Week ${weekNum} (inserted ${inserted || "?"}).`
          );
        }
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          {course?.code} — Weeks
        </h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {WEEK_NUMBERS.map((num) => {
            const weekData = weeks.find((w) => w.week_number === num);
            const hasTutorial = !!weekData?.tutorial_url;
            const hasQuestions = !!weekHasQuestions[num];

            return (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: num * 0.03 }}
              >
                <button
                  onClick={() =>
                    setSelectedWeek(selectedWeek === num ? null : num)
                  }
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    selectedWeek === num
                      ? "bg-cyan-50 border-2 border-cyan-400"
                      : "bg-white hover:bg-slate-50 border-2 border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${hasQuestions ? "bg-green-500/30 text-green-800" : "bg-slate-200 text-slate-800"}`}
                      >
                        {num}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Week {num}
                        </p>
                        <p className="text-xs text-slate-800 font-medium">
                          {hasQuestions
                            ? "Ready to play"
                            : hasTutorial
                              ? "Tutorial uploaded"
                              : "No questions yet"}
                        </p>
                      </div>
                    </div>
                    {hasQuestions && (
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                </button>
                <AnimatePresence>
                  {selectedWeek === num && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 ml-4 mt-1 space-y-2 border-l-2 border-cyan-500/30">
                        {hasTutorial && weekData?.tutorial_url && (
                          <a
                            href={weekData.tutorial_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-slate-800 hover:text-slate-900 font-medium"
                          >
                            <FileText className="w-3 h-3" /> View Tutorial
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpload(num)}
                          disabled={uploading}
                          className="w-full border-2 border-slate-400 bg-white text-slate-800 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold"
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          {uploading
                            ? "Uploading..."
                            : hasTutorial
                              ? "Replace Tutorial"
                              : "Upload Tutorial"}
                        </Button>
                        {course && (
                          <Button
                            size="sm"
                            onClick={() => onStartGame(course, weekData ?? { week_number: num })}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs shadow-lg shadow-pink-500/25"
                          >
                            <Play className="w-3 h-3 mr-1" /> Start Game
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
