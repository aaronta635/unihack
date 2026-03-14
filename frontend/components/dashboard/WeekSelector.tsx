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

    let cancelled = false;
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

    const load = async () => {
      try {
        const results = await Promise.all(
          WEEK_NUMBERS.map(async (num) => {
            const res = await fetch(
              `${base}/api/questions?course_id=${encodeURIComponent(
                course.id
              )}&week_number=${num}`
            );
            if (!res.ok) return [num, false] as const;
            const json = await res.json().catch(() => ({ questions: [] }));
            const hasQ =
              Array.isArray(json.questions) && json.questions.length > 0;
            return [num, hasQ] as const;
          })
        );
        if (!cancelled) {
          setWeekHasQuestions(Object.fromEntries(results));
        }
      } catch (err) {
        console.error("Failed to load week question availability", err);
        if (!cancelled) {
          setWeekHasQuestions({});
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
          <Calendar className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-[#4a2b3e]">
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
                      ? "bg-[#ffb3c6]/30 border-2 border-[#ff8fb1]"
                      : "bg-[#ffe6f0]/60 hover:bg-[#ffd6e8]/80 border-2 border-[#ffd6e8] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${hasQuestions ? "bg-[#ff8fb1]/80 text-white" : "bg-[#ffe6f0] text-[#4a2b3e]"}`}
                      >
                        {num}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#4a2b3e]">
                          Week {num}
                        </p>
                        <p className="text-xs text-[#8b5a7a] font-medium">
                          {hasQuestions
                            ? "Ready to play"
                            : hasTutorial
                              ? "Tutorial uploaded"
                              : "No questions yet"}
                        </p>
                      </div>
                    </div>
                    {hasQuestions && (
                      <Sparkles className="w-4 h-4 text-[#ff9b4d]" />
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
                      <div className="p-3 ml-4 mt-1 space-y-2 border-l-2 border-[#ffb3c6]/60">
                        {hasTutorial && weekData?.tutorial_url && (
                          <a
                            href={weekData.tutorial_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-[#4a2b3e] hover:text-[#c2185b] font-medium"
                          >
                            <FileText className="w-3 h-3" /> View Tutorial
                          </a>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpload(num)}
                          disabled={uploading}
                          className="w-full border-2 border-[#ffd6e8] bg-[#ffe6f0]/60 text-[#4a2b3e] hover:bg-[#ffd6e8]/80 hover:text-[#2b1020] text-xs font-semibold"
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
                            className="w-full bg-gradient-to-r from-[#ffc5d0] to-[#ff8a8a] hover:from-[#ffd0da] hover:to-[#ff9b9b] text-white text-xs shadow-lg shadow-pink-300/30"
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
