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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffc5d0] via-[#ff8a8a] to-[#6b5bff] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#4a2b3e]">StudyQuest</h1>
              <p className="text-xs text-[#8b5a7a] font-semibold">
                {user ? `Welcome, ${user.full_name || user.email}` : "Dashboard"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-[#4a2b3e] hover:text-[#2b1020] hover:bg-[#ffe6f0]/60 font-semibold border border-[#ffb3c6] bg-white/60 backdrop-blur-sm"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
        <div className="p-4 md:px-8 md:pb-8">
          <div className="max-w-4xl mx-auto">
            <Dialog open={selectionDialogOpen} onOpenChange={setSelectionDialogOpen}>
              <DialogTrigger asChild>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-full bg-gradient-to-r from-[#ffe6f0]/80 via-[#ffe6de]/80 to-[#e0f7ff]/80 backdrop-blur-xl rounded-2xl p-8 border border-[#ffb3c6]/70 hover:shadow-2xl hover:shadow-pink-300/40 transition-all shadow-xl shadow-pink-200/50 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ffc5d0] via-[#ff8a8a] to-[#6b5bff] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-black/70">
                      <Gamepad2 className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-2xl font-black text-[#4a2b3e] mb-2">
                        Start Playing
                      </h3>
                      <p className="text-sm text-[#8b5a7a] font-medium">
                        {selectedSchool && selectedCourse
                          ? `${selectedSchool.name} - ${selectedCourse.code}`
                          : "Choose university, course, and week"}
                      </p>
                    </div>
                    <Sparkles className="w-8 h-8 text-[#ff9b4d] group-hover:scale-125 transition-transform" />
                  </div>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-[#ffe6f0]/95 via-[#fff7fb]/95 to-[#e0f7ff]/95 shadow-[0_18px_45px_rgba(255,182,193,0.55)] border border-[#ffb3c6]/80">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-[#4a2b3e]">
                    Select University, Course & Week
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[75vh]">
                  <div className="overflow-y-auto pr-2">
                    <h3 className="text-sm font-bold text-[#b66d94] uppercase mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Universities
                    </h3>
                    <SchoolSelector
                      schools={schools}
                      selectedSchool={selectedSchool}
                      onSelect={(school) => {
                        setSelectedSchool(school);
                        setSelectedCourse(null);
                      }}
                    />
                  </div>
                  <div className="overflow-y-auto pr-2 border-l border-[#ffd6e8] pl-4">
                    <h3 className="text-sm font-bold text-[#b66d94] uppercase mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" /> Courses
                    </h3>
                    {selectedSchool ? (
                      <CourseSelector
                        courses={courses}
                        selectedCourse={selectedCourse}
                        onSelect={setSelectedCourse}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#8b5a7a] text-sm font-semibold text-center">
                          Select a university first
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="overflow-y-auto pr-2 border-l border-[#ffd6e8] pl-4">
                    <h3 className="text-sm font-bold text-[#b66d94] uppercase mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Weeks
                    </h3>
                    {selectedCourse ? (
                      <WeekSelector
                        course={selectedCourse}
                        onStartGame={(course, week) =>
                          handleStartGame(course, week)
                        }
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-[#8b5a7a] text-sm font-semibold text-center">
                          Select a course first
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 max-w-7xl mx-auto bg-gradient-to-r from-[#ffe6f0]/85 via-[#fff7fb]/85 to-[#e0f7ff]/85 backdrop-blur-xl rounded-2xl p-6 border border-[#ffb3c6]/80 shadow-[0_18px_45px_rgba(255,182,193,0.55)]"
          >
            <Leaderboard scores={scores} />
          </motion.div>
        </div>
        <div className="p-4 md:px-8 md:pb-8" />
      </div>
      <AnimatePresence>
        <CourseSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </AnimatePresence>
    </div>
  );
}
