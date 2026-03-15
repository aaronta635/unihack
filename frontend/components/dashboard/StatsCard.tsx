"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Shield, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import type { PlayerStats } from "@/lib/api/client";

type Props = {
  stats: PlayerStats | null;
  isLoading?: boolean;
  /** When true, user is logged in — show “play a game” instead of “log in” when stats are missing. */
  isLoggedIn?: boolean;
  onStatsUpdated?: () => void;
};

export default function StatsCard({ stats, isLoading, isLoggedIn, onStatsUpdated }: Props) {
  const [allocating, setAllocating] = useState<"attack" | "defense" | null>(null);
  if (isLoading) {
    return (
      <div className="rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/85 to-[#e0f7ff]/80 backdrop-blur-xl p-6 shadow-lg shadow-pink-200/40">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-[#4a2b3e]">Your stats</h2>
        </div>
        <p className="text-sm text-[#8b5a7a]">Loading…</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/85 to-[#e0f7ff]/80 backdrop-blur-xl p-6 shadow-lg shadow-pink-200/40">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-[#4a2b3e]">Your stats</h2>
        </div>
        <p className="text-sm text-[#8b5a7a]">
          {isLoggedIn
            ? "Play a weekly game to earn XP. Your attack, defense, and stats will appear here."
            : "Log in to see your attack, defense, and XP."}
        </p>
      </div>
    );
  }

  const {
    attack,
    defense,
    xp,
    level,
    stat_points,
    xp_in_current_level,
    xp_to_next_level,
    xp_per_level,
  } = stats;

  const levelProgress = xp_per_level > 0 ? (xp_in_current_level / xp_per_level) * 100 : 0;

  const handleAllocate = async (type: "attack" | "defense") => {
    setAllocating(type);
    try {
      const updated = await api.stats.allocate(type);
      if (updated) onStatsUpdated?.();
    } finally {
      setAllocating(null);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/85 to-[#e0f7ff]/80 backdrop-blur-xl p-6 shadow-lg shadow-pink-200/40">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-[#4a2b3e]">Your stats</h2>
      </div>

      {/* Level bar and data */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-[#4a2b3e] mb-1">
          <span className="font-bold">Level {level}</span>
          <span className="text-[#8b5a7a] font-medium">
            {xp_in_current_level} / {xp_per_level} XP → next level
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/60 border border-[#ffd6e8] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#ff8fb1] to-[#ffb3c6]"
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-xs text-[#8b5a7a] mt-1">
          Total XP: {xp} · {xp_to_next_level} XP to level {level + 1}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white/60 border-2 border-[#ffd6e8] p-3"
        >
          <div className="flex items-center gap-2 text-[#4a2b3e]">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wide">Attack</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xl font-black text-[#4a2b3e]">{attack}</p>
            {stat_points > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-[#ff8fb1] text-[#4a2b3e] hover:bg-[#ffe6f0]/80"
                onClick={() => handleAllocate("attack")}
                disabled={!!allocating}
              >
                <Plus className="w-3 h-3 mr-0.5" />
                {allocating === "attack" ? "…" : "1"}
              </Button>
            )}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl bg-white/60 border-2 border-[#ffd6e8] p-3"
        >
          <div className="flex items-center gap-2 text-[#4a2b3e]">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-wide">Defense</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xl font-black text-[#4a2b3e]">{defense}</p>
            {stat_points > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-[#ff8fb1] text-[#4a2b3e] hover:bg-[#ffe6f0]/80"
                onClick={() => handleAllocate("defense")}
                disabled={!!allocating}
              >
                <Plus className="w-3 h-3 mr-0.5" />
                {allocating === "defense" ? "…" : "1"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>

      {stat_points > 0 && (
        <p className="text-xs text-[#8b5a7a] mt-3 font-medium">
          You have {stat_points} stat point{stat_points !== 1 ? "s" : ""} to spend. Use +1 on Attack or Defense above.
        </p>
      )}

      <p className="text-xs text-[#8b5a7a] mt-2">
        Base: Attack and Defense start at 5 and increase by 1 per level. Spend stat points to add extra +1.
      </p>
    </div>
  );
}
