"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import AnimeBackground from "@/components/game/Background";
import SchoolSelector from "@/components/dashboard/SchoolSelector";
import CourseSelector from "@/components/dashboard/CourseSelector";

type School = { id: string; name: string; code?: string };
type Course = { id: string; code: string; title: string; school_id?: string };

export default function CourseSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: () => api.entities.School.list(),
  });

  const { data: allCourses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.entities.Course.list(),
  });

  const courses = selectedSchool
    ? (allCourses as Course[]).filter(
        (c) => !c.school_id || c.school_id === selectedSchool.id
      )
    : [];

  const handleSelectCourse = (course: Course) => {
    setSelectedCourse(course);
    router.push(`/Dashboard/course/${course.id}`);
    onClose();
    setSelectedSchool(null);
    setSelectedCourse(null);
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        style={{ pointerEvents: open ? "auto" : "none" }}
      />
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 z-50 h-full w-full max-w-md bg-white/95 dark:bg-slate-900/95 shadow-2xl border-r border-slate-200 dark:border-slate-700 flex flex-col"
      >
        <div className="relative flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {!selectedSchool
                ? "Select university"
                : "Select course"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <AnimatePresence mode="wait">
              {!selectedSchool ? (
                <motion.div
                  key="schools"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      Choose your university
                    </span>
                  </div>
                  <SchoolSelector
                    schools={schools as School[]}
                    selectedSchool={selectedSchool}
                    onSelect={setSelectedSchool}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="courses"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedSchool(null);
                      setSelectedCourse(null);
                    }}
                    className="mb-2 text-slate-600 dark:text-slate-400"
                  >
                    ← Back to universities
                  </Button>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      {selectedSchool.name}
                    </span>
                  </div>
                  <CourseSelector
                    courses={courses}
                    selectedCourse={selectedCourse}
                    onSelect={handleSelectCourse}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
