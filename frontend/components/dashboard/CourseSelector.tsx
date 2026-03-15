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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-black">Courses</h2>
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
                  ? "bg-gradient-to-r from-[#ffb3c6]/90 to-[#ffc5d0]/90 border-2 border-[#ff8fb1] shadow-lg"
                  : "bg-[#ffe6f0]/70 hover:bg-[#ffd6e8]/80 border-2 border-[#ffd6e8] hover:border-[#ff8fb1]"
              }`}
            >
              <div>
                <p
                  className="font-semibold text-sm text-black"
                >
                  {course.code}
                </p>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  {course.title}
                </p>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${selectedCourse?.id === course.id ? "text-black translate-x-0" : "text-gray-600 -translate-x-2 group-hover:translate-x-0 group-hover:text-black"}`}
              />
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
