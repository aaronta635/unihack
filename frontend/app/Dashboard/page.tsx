"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import {
  LogOut,
  Gamepad2,
  Sparkles,
  GraduationCap,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AnimeBackground from "@/components/game/Background";
import SchoolSelector from "@/components/dashboard/SchoolSelector";
import CourseSelector from "@/components/dashboard/CourseSelector";
import WeekSelector from "@/components/dashboard/WeekSelector";
import Leaderboard from "@/components/dashboard/Leaderboard";

export default function Dashboard() {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState<{
    id: string;
    name: string;
    code?: string;
  } | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<{
    id: string;
    code: string;
    title: string;
  } | null>(null);
  const [user] = useState({
    full_name: "Demo User",
    email: "demo@studyquest.com",
  });
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.entities.School.list(),
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.entities.Course.list(),
  });

  const courses = selectedSchool
    ? allCourses.filter(
        (c: { school_id?: string }) =>
          !c.school_id || c.school_id === selectedSchool.id
      )
    : [];

  const { data: scores = [] } = useQuery({
    queryKey: ["scores"],
    queryFn: () => api.entities.Score.list("-score", 50),
  });

  const handleStartGame = (
    course: { id: string; title?: string; code?: string },
    weekData: { week_number: number }
  ) => {
    const params = new URLSearchParams({
      courseId: course.id,
      courseTitle: course.title ?? "",
      courseCode: course.code ?? "",
      weekNumber: String(weekData.week_number),
    });
    router.push(`/GamePlay?${params.toString()}`);
    setSelectionDialogOpen(false);
  };

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="text-slate-700 hover:text-slate-900 hover:bg-white/40 font-semibold border-2 border-pink-300"
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
                  className="w-full bg-slate-100 backdrop-blur-xl border-4 border-slate-300 rounded-2xl p-8 hover:shadow-2xl transition-all shadow-xl group hover:bg-slate-200"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 via-orange-400 to-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <Gamepad2 className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="text-2xl font-black text-slate-700 mb-2">
                        Start Playing
                      </h3>
                      <p className="text-sm text-slate-600 font-medium">
                        {selectedSchool && selectedCourse
                          ? `${selectedSchool.name} - ${selectedCourse.code}`
                          : "Choose university, course, and week"}
                      </p>
                    </div>
                    <Sparkles className="w-8 h-8 text-slate-500 group-hover:scale-125 transition-transform" />
                  </div>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-black text-slate-700">
                    Select University, Course & Week
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[75vh]">
                  <div className="overflow-y-auto pr-2">
                    <h3 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
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
                  <div className="overflow-y-auto pr-2 border-l-2 border-slate-200 pl-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
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
                        <p className="text-slate-500 text-sm font-semibold text-center">
                          Select a university first
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="overflow-y-auto pr-2 border-l-2 border-slate-200 pl-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
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
                        <p className="text-slate-500 text-sm font-semibold text-center">
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
            className="mt-6 max-w-7xl mx-auto bg-slate-100 backdrop-blur-xl border-4 border-slate-300 rounded-2xl p-6 shadow-xl"
          >
            <Leaderboard scores={scores} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
