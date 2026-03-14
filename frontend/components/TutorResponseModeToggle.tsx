"use client";

export type TutorResponseMode = "text" | "voice";

type TutorResponseModeToggleProps = {
  mode: TutorResponseMode;
  onChange: (mode: TutorResponseMode) => void;
  className?: string;
};

export default function TutorResponseModeToggle({
  mode,
  onChange,
  className = "",
}: TutorResponseModeToggleProps) {
  return (
    <div
      className={`flex rounded-xl border-2 border-slate-600/50 bg-slate-800/60 overflow-hidden ${className}`}
      role="group"
      aria-label="Response mode"
    >
      <button
        type="button"
        onClick={() => onChange("text")}
        className={`px-3 py-2 text-sm font-semibold transition-colors ${
          mode === "text"
            ? "bg-cyan-500/30 text-cyan-200 border-cyan-400/50"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
        }`}
        aria-pressed={mode === "text"}
      >
        Text
      </button>
      <button
        type="button"
        onClick={() => onChange("voice")}
        className={`px-3 py-2 text-sm font-semibold transition-colors border-l border-slate-600/50 ${
          mode === "voice"
            ? "bg-cyan-500/30 text-cyan-200 border-cyan-400/50"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
        }`}
        aria-pressed={mode === "voice"}
      >
        Voice
      </button>
    </div>
  );
}
