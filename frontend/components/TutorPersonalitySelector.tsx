"use client";

import { TUTOR_PERSONALITIES } from "@/lib/tutorPersonalities";

type TutorPersonalitySelectorProps = {
  value: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function TutorPersonalitySelector({
  value,
  onChange,
  className = "",
}: TutorPersonalitySelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title="Tutor personality"
      className={`rounded-xl border-2 border-slate-600/50 bg-slate-800/80 text-slate-200 text-sm font-medium px-3 py-2 focus:border-cyan-400/60 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 ${className}`}
      aria-label="Select tutor personality"
    >
      {TUTOR_PERSONALITIES.map((p) => (
        <option key={p.key} value={p.key}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
