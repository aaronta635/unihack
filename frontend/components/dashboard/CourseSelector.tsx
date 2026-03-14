"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Course = { id: string; code: string; title: string };

export default function CourseSelector({
  courses,
  selectedCourse,
  onSelect,
}: {
  courses: Course[];
  selectedCourse: Course | null;
  onSelect: (course: Course) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-700">Courses</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {courses.map((course, i) => (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(course)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 group flex items-center justify-between ${
                selectedCourse?.id === course.id
                  ? "bg-gradient-to-r from-orange-100 to-pink-100 border-2 border-orange-400 shadow-lg"
                  : "bg-slate-200/60 hover:bg-slate-300/60 border-2 border-slate-300 hover:border-orange-300"
              }`}
            >
              <div>
                <p
                  className={`font-semibold text-sm ${selectedCourse?.id === course.id ? "text-orange-800" : "text-slate-700"}`}
                >
                  {course.code}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  {course.title}
                </p>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${selectedCourse?.id === course.id ? "text-orange-600 translate-x-0" : "text-slate-400 -translate-x-2 group-hover:translate-x-0 group-hover:text-orange-500"}`}
              />
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
