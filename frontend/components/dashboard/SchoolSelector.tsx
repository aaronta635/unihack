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
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-lg font-bold text-black">Universities</h2>
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
                  ? "bg-gradient-to-r from-[#ffb3c6]/90 to-[#ffc5d0]/90 border-2 border-[#ff8fb1] shadow-lg"
                  : "bg-[#ffe6f0]/70 hover:bg-[#ffd6e8]/80 border-2 border-[#ffd6e8] hover:border-[#ff8fb1]"
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
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ffc5d0] to-[#ff8a8a] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {school.code}
                    </span>
                  </div>
                )}
                <div>
                  <p
                    className={`font-semibold text-sm text-black`}
                  >
                    {school.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-medium">
                    {school.code}
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-transform ${selectedSchool?.id === school.id ? "text-black translate-x-0" : "text-gray-600 -translate-x-2 group-hover:translate-x-0 group-hover:text-black"}`}
              />
            </motion.button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
