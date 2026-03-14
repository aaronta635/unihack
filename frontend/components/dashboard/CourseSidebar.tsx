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
        className="fixed inset-0 z-40 bg-[#ffe6f0]/50 backdrop-blur-sm"
        style={{ pointerEvents: open ? "auto" : "none" }}
      />
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 z-50 h-full w-full max-w-md bg-gradient-to-b from-[#fff7fb] to-[#ffe6f0]/95 shadow-2xl border-r border-[#ffd6e8] flex flex-col"
      >
        <div className="relative flex-1 flex flex-col min-h-0">
          <div className="p-4 border-b border-[#ffd6e8] flex items-center justify-between bg-[#ffe6f0]/50">
            <h2 className="text-lg font-bold text-[#4a2b3e]">
              {!selectedSchool
                ? "Select university"
                : "Select course"}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full text-[#4a2b3e] hover:bg-[#ffd6e8]/80 hover:text-[#2b1020]"
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
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-[#8b5a7a]">
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
                    className="mb-2 text-[#8b5a7a] hover:text-[#4a2b3e] hover:bg-[#ffd6e8]/60"
                  >
                    ← Back to universities
                  </Button>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-[#4a2b3e]">
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
