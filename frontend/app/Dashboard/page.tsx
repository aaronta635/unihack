"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { LogOut, Gamepad2, Menu, Shield, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";
import CourseSidebar from "@/components/dashboard/CourseSidebar";
import Leaderboard from "@/components/dashboard/Leaderboard";
import { useAdminMode } from "@/contexts/AdminModeContext";

const HELLO_FONTS = [
  { name: "Datatype", class: "font-datatype" },
  { name: "Bitcount Prop Double Ink", class: "font-bitcount" },
] as const;

export default function Dashboard() {
  const router = useRouter();
  const { isAdmin, setAdmin } = useAdminMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fontIndex, setFontIndex] = useState(0);
  const [useItalic, setUseItalic] = useState(false);

  const [user] = useState({
    full_name: "Demo User",
    email: "demo@studyquest.com",
  });

  const displayName = user?.full_name || user?.email || "User";

  // Rotate font every 2 seconds with random italic
  useEffect(() => {
    const t = setInterval(() => {
      setFontIndex((i) => (i + 1) % HELLO_FONTS.length);
      setUseItalic((prev) => Math.random() > 0.5);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const { data: scores = [] } = useQuery({
    queryKey: ["scores"],
    queryFn: () => api.entities.Score.list("-score", 50),
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimeBackground />
      <div className="relative z-10">
        <div className="flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#4a2b3e]">StudyQuest</h1>
              <p className="text-xs text-[#8b5a7a] font-semibold">
                {user ? `Welcome, ${displayName}` : "Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAdmin(!isAdmin)}
              className={`font-semibold border-2 transition-colors ${
                isAdmin
                  ? "bg-[#ffe6f0]/80 border-[#ff8fb1] text-[#c2185b] hover:bg-[#ffd6e8]"
                  : "bg-white/70 border-[#ffd6e8] text-[#4a2b3e] hover:bg-[#ffe6f0]/60 hover:border-[#ffb3c6]"
              }`}
              title={isAdmin ? "Admin mode (click to switch to student)" : "Student mode (click to switch to admin)"}
            >
              {isAdmin ? (
                <Shield className="w-4 h-4 mr-1.5" />
              ) : (
                <ShieldOff className="w-4 h-4 mr-1.5" />
              )}
              {isAdmin ? "Admin" : "Student"}
            </Button>
            <Button
              onClick={() => setSidebarOpen(true)}
              className="bg-[#ffe6f0]/90 hover:bg-[#ffd6e8] border-2 border-[#ffb3c6] text-[#4a2b3e] font-semibold"
            >
              <Menu className="w-4 h-4 mr-2" />
              Choose course
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-[#4a2b3e] hover:text-[#2b1020] hover:bg-[#ffe6f0]/60 font-semibold border-2 border-[#ffb3c6] bg-white/60 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>

        <div className="p-4 md:px-8 md:pb-8 max-w-4xl mx-auto space-y-6">
          {/* Hello Username - big, game-style rotating font */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/90 via-[#fff7fb]/90 to-[#ffe6de]/90 backdrop-blur-xl p-8 shadow-lg shadow-pink-200/40"
          >
            <p
              className={`text-4xl md:text-5xl font-black text-[#4a2b3e] text-center transition-all duration-300 ${HELLO_FONTS[fontIndex].class}`}
              style={{ fontStyle: useItalic ? "italic" : "normal" }}
            >
              Hello, {displayName}
            </p>
          </motion.section>

          {/* Start your study journey (Playground PVP placeholder) */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => {}}
              className="w-full rounded-2xl border-2 border-[#ffb3c6] bg-gradient-to-r from-[#ffc5d0] to-[#ff8a8a] hover:from-[#ffd0da] hover:to-[#ff9b9b] text-white font-bold text-lg py-6 shadow-lg shadow-pink-300/40 transition-all hover:shadow-pink-300/60"
              title="Playground PVP — coming in another branch"
            >
              <Gamepad2 className="w-5 h-5 mr-2" />
              Start your study journey
            </Button>
            <p className="text-center text-xs text-[#8b5a7a] font-medium mt-2">
              Enter playground PVP (in development)
            </p>
          </motion.section>

          {/* Leaderboard */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border-2 border-[#ffd6e8] bg-gradient-to-r from-[#ffe6f0]/85 via-[#fff7fb]/85 to-[#e0f7ff]/80 backdrop-blur-xl p-6 shadow-lg shadow-pink-200/40"
          >
            <Leaderboard scores={scores as { id: string; player_name: string; course_title?: string; week_number?: number; score: number }[]} />
          </motion.section>
        </div>
      </div>
      <AnimatePresence>
        <CourseSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </AnimatePresence>
    </div>
  );
}
