"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Upload, Play, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api/client";

type Week = {
  week_number: number;
  title?: string;
  tutorial_url?: string;
  questions?: unknown[];
};

type Course = { id: string; code?: string; weeks?: Week[] };

export default function WeekSelector({
  course,
  onStartGame,
}: {
  course: Course | null;
  onStartGame: (course: Course, weekData: Week) => void;
}) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const weeks = course?.weeks ?? [];

  const handleUpload = async (weekNum: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx,.txt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file || !course) return;
      setUploading(true);
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      const updatedWeeks = [...(course.weeks ?? [])];
      const weekIdx = updatedWeeks.findIndex((w) => w.week_number === weekNum);
      if (weekIdx >= 0) {
        updatedWeeks[weekIdx] = {
          ...updatedWeeks[weekIdx],
          tutorial_url: file_url,
        };
      } else {
        updatedWeeks.push({
          week_number: weekNum,
          title: `Week ${weekNum}`,
          tutorial_url: file_url,
          questions: [],
        });
      }
      await api.entities.Course.update(course.id, { weeks: updatedWeeks });
      setUploading(false);
    };
    input.click();
  };

  const weekNumbers = Array.from({ length: 12 }, (_, i) => i + 1);

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
          {weekNumbers.map((num) => {
            const weekData = weeks.find((w) => w.week_number === num);
            const hasQuestions = (weekData?.questions?.length ?? 0) > 0;
            const hasTutorial = !!weekData?.tutorial_url;

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
                      ? "bg-gradient-to-r from-cyan-100 to-blue-100 border-2 border-cyan-400"
                      : "bg-slate-200/60 hover:bg-slate-300/60 border-2 border-slate-300"
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
                            ? `${weekData!.questions!.length} questions ready`
                            : hasTutorial
                              ? "Tutorial uploaded"
                              : "No content yet"}
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
                        {hasQuestions && weekData && course && (
                          <Button
                            size="sm"
                            onClick={() => onStartGame(course, weekData)}
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
