"use client";

import { motion } from "framer-motion";
import { GraduationCap, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type School = { id: string; name: string; code?: string; logo_url?: string };

export default function SchoolSelector({
  schools,
  selectedSchool,
  onSelect,
}: {
  schools: School[];
  selectedSchool: School | null;
  onSelect: (school: School) => void;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-slate-700">Universities</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-2">
          {schools.map((school, i) => (
            <motion.button
              key={school.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(school)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 group flex items-center justify-between ${
                selectedSchool?.id === school.id
                  ? "bg-gradient-to-r from-pink-100 to-rose-100 border-2 border-pink-400 shadow-lg"
                  : "bg-slate-200/60 hover:bg-slate-300/60 border-2 border-slate-300 hover:border-pink-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {school.logo_url ? (
                  <img
                    src={school.logo_url}
                    alt={school.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {school.code}
                    </span>
                  </div>
                )}
                <div>
                  <p
                    className={`font-semibold text-sm ${selectedSchool?.id === school.id ? "text-pink-800" : "text-slate-700"}`}
                  >
                    {school.name}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {school.code}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${selectedSchool?.id === school.id ? "text-pink-600 translate-x-0" : "text-slate-400 -translate-x-2 group-hover:translate-x-0 group-hover:text-pink-500"}`}
              />
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
