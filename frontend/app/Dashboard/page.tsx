"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Gamepad2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimeBackground from "@/components/game/Background";
import CourseSidebar from "@/components/dashboard/CourseSidebar";

export default function Dashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user] = useState({
    full_name: "Demo User",
    email: "demo@studyquest.com",
  });

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimeBackground />
      <div className="relative z-10">
        <div className="flex items-center justify-between p-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800">StudyQuest</h1>
              <p className="text-xs text-slate-600 font-semibold">
                {user ? `Welcome, ${user.full_name || user.email}` : "Dashboard"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setSidebarOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-800 font-semibold"
            >
              <Menu className="w-4 h-4 mr-2" />
              Choose course
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="text-slate-700 hover:text-slate-900 hover:bg-white/40 font-semibold border-2 border-pink-300"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
        <div className="p-4 md:px-8 md:pb-8" />
      </div>
      <AnimatePresence>
        <CourseSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </AnimatePresence>
    </div>
  );
}
