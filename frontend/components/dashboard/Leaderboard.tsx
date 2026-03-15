"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const rankStyles = [
  {
    bg: "from-[#ffb3c6] to-[#ffc5d0]",
    border: "border-[#ff8fb1]/80",
    icon: Crown,
    iconColor: "text-black",
  },
  {
    bg: "from-[#ffe6f0] to-[#ffe6de]",
    border: "border-[#ffd6e8]/80",
    icon: Medal,
    iconColor: "text-black",
  },
  {
    bg: "from-[#ffe6de] to-[#e0f7ff]/90",
    border: "border-[#ffb3c6]/60",
    icon: Medal,
    iconColor: "text-black",
  },
];

type Score = {
  id: string;
  player_name: string;
  course_title?: string;
  week_number?: number;
  score: number;
  total_questions?: number;
};

export default function Leaderboard({ scores }: { scores: Score[] }) {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-black">Leaderboard</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {sorted.length === 0 && (
            <div className="text-center py-8 bg-[#ffe6f0]/80 rounded-xl border border-[#ffd6e8]">
              <Star className="w-8 h-8 text-black/60 mx-auto mb-2" />
              <p className="text-black text-sm font-semibold">
                No scores yet
              </p>
              <p className="text-black text-xs font-medium">
                Play a game to get on the board!
              </p>
            </div>
          )}
          {sorted.map((score, i) => {
            const style = rankStyles[i] ?? null;
            const RankIcon = style?.icon;
            return (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`p-3 rounded-xl flex items-center gap-3 ${
                  style
                    ? `bg-gradient-to-r ${style.bg} border ${style.border}`
                    : "bg-[#ffe6f0]/70 border border-[#ffd6e8]"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    style
                      ? "bg-white/80"
                      : "bg-[#ffd6e8]/80"
                  }`}
                >
                  {RankIcon ? (
                    <RankIcon className={`w-4 h-4 ${style?.iconColor ?? "text-black"}`} />
                  ) : (
                    <span className="text-xs font-bold text-black">
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-black truncate">
                    {score.player_name}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    {score.course_title ?? "—"} • Week {score.week_number ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-black">
                    {score.score}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
