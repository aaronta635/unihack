"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const rankStyles = [
  {
    bg: "from-amber-100 to-yellow-100",
    border: "border-amber-300",
    icon: Crown,
    iconColor: "text-slate-800",
  },
  {
    bg: "from-slate-100 to-slate-50",
    border: "border-slate-300",
    icon: Medal,
    iconColor: "text-slate-800",
  },
  {
    bg: "from-orange-100 to-amber-100",
    border: "border-orange-300",
    icon: Medal,
    iconColor: "text-slate-800",
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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Leaderboard</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {sorted.length === 0 && (
            <div className="text-center py-8 bg-amber-50/80 rounded-xl border border-amber-200">
              <Star className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-slate-800 text-sm font-semibold">
                No scores yet
              </p>
              <p className="text-slate-600 text-xs font-medium">
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
                    : "bg-slate-100 border border-slate-200"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    style
                      ? `${(style.bg as string).replace("from-", "bg-").split(" ")[0]}`
                      : "bg-slate-200"
                  }`}
                >
                  {RankIcon ? (
                    <RankIcon className={`w-4 h-4 ${style.iconColor}`} />
                  ) : (
                    <span className="text-xs font-bold text-slate-900">
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {score.player_name}
                  </p>
                  <p className="text-xs text-slate-800 font-medium">
                    {score.course_title ?? "—"} • Week {score.week_number ?? "—"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">
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
