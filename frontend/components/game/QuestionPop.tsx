"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

type Question = {
  question: string;
  options: string[];
  correct_index: number;
};

export default function QuestionPopup({
  target,
  onAnswer,
}: {
  target: { question: Question };
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const question = target.question;

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    const isCorrect = idx === question.correct_index;
    setTimeout(() => onAnswer(isCorrect), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm rounded-2xl"
    >
      <motion.div
        initial={{ scale: 0.7, y: 30, rotateX: -30 }}
        animate={{ scale: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.7, y: 30, rotateX: 30 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border-4 border-yellow-400/60 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl shadow-yellow-500/30 relative overflow-hidden"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
            />
          ))}
        </div>
        <div className="flex items-start gap-4 mb-6 relative z-10">
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-yellow-500/50"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div className="flex-1">
            <p className="text-xs font-bold text-yellow-300 mb-1 uppercase tracking-wide">
              Quest Challenge
            </p>
            <p className="text-white font-bold text-base leading-relaxed">
              {question.question}
            </p>
          </div>
        </div>
        <div className="space-y-3 relative z-10">
          {question.options.map((opt, idx) => {
            let style =
              "bg-gradient-to-r from-slate-800/80 to-slate-700/80 border-cyan-400/40 hover:from-cyan-900/60 hover:to-purple-900/60 hover:border-cyan-300/60 text-white shadow-lg hover:shadow-cyan-500/20";
            if (revealed) {
              if (idx === question.correct_index) {
                style =
                  "bg-gradient-to-r from-green-600/60 to-emerald-600/60 border-green-400/80 text-green-100 shadow-xl shadow-green-500/30";
              } else if (selected === idx && idx !== question.correct_index) {
                style =
                  "bg-gradient-to-r from-red-600/60 to-rose-600/60 border-red-400/80 text-red-100 shadow-xl shadow-red-500/30";
              } else {
                style = "bg-slate-900/40 border-slate-700/40 text-slate-500";
              }
            }
            return (
              <motion.button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={revealed}
                whileHover={{ scale: revealed ? 1 : 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-xl border-2 text-sm font-bold transition-all duration-300 ${style} flex items-center gap-3`}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white font-black text-center leading-8 shadow-lg">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt}</span>
                {revealed && idx === question.correct_index && (
                  <Sparkles className="w-5 h-5 text-green-300" />
                )}
              </motion.button>
            );
          })}
        </div>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className="mt-6 text-center relative z-10"
          >
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-full font-black text-lg ${
                selected === question.correct_index
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-500/40"
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-xl shadow-red-500/40"
              }`}
            >
              {selected === question.correct_index ? (
                <>
                  <Sparkles className="w-6 h-6" />
                  Correct! +10 Points!
                  <Sparkles className="w-6 h-6" />
                </>
              ) : (
                <>
                  <X className="w-6 h-6" />
                  Wrong Answer!
                  <X className="w-6 h-6" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
