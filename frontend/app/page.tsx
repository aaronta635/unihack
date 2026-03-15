"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  GraduationCap,
  Zap,
  Star,
  User,
  Mail,
  Lock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AnimeBackground from "@/components/game/Background";
import StudyGoLogo from "@/components/StudyGoLogo";

export default function Home() {
  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleEnter = () => setShowAuth(true);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "/Dashboard";
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <AnimeBackground />
      <AnimatePresence mode="wait">
        {!showAuth ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 max-w-lg w-full mx-4"
          >
            <motion.div
              initial={{ y: -40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="inline-block mb-6"
              >
                <div className="flex items-center gap-3 rounded-3xl shadow-2xl border-2 border-[#2a7a76]/80 bg-[#1E615D] pl-4 pr-6 py-4 mx-auto">
                  <StudyGoLogo className="w-16 h-16 flex-shrink-0" />
                  <span className="text-white font-bold text-2xl tracking-tight lowercase">studygo</span>
                </div>
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-black text-black mb-3 drop-shadow-lg">
                studygo
              </h1>
              <p className="text-black text-lg font-semibold">
                Learn. Play.{" "}
                <span className="font-black">Conquer.</span>
              </p>
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              {[
                { icon: GraduationCap, label: "Course Based", gradient: "from-[#ffc5d0] to-[#ff8a8a]" },
                { icon: Zap, label: "Interactive", gradient: "from-[#ff9b4d] to-[#ff8a8a]" },
                { icon: Star, label: "Leaderboard", gradient: "from-[#ffb3c6] to-[#ff8fb1]" },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="bg-[#ffe6f0]/70 backdrop-blur border-2 border-[#ffd6e8] rounded-2xl p-4 text-center shadow-md"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center mx-auto mb-2 shadow-lg ring-2 ring-white/50`}>
                    <feat.icon className="w-6 h-6 text-white" strokeWidth={2} />
                  </div>
                  <p className="text-xs font-bold text-black">{feat.label}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                onClick={handleEnter}
                className="w-full h-14 bg-gradient-to-r from-[#ffc5d0] via-[#ff8a8a] to-[#ff9b4d] hover:from-[#ffd0da] hover:via-[#ff9b9b] hover:to-[#ffae6b] text-white font-bold text-lg rounded-2xl shadow-2xl shadow-pink-300/40 transition-all duration-300 hover:shadow-pink-300/50 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5 mr-2" strokeWidth={2} />
                Enter studygo
              </Button>
              <p className="text-center text-xs text-black font-medium mt-3">
                Australian Schools Edition • Demo v1.0
              </p>
            </motion.div>
          </motion.div>
        ) : (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 max-w-md w-full mx-4"
            >
              <div className="bg-gradient-to-br from-[#ffe6f0]/95 via-[#ffd6e8]/95 to-[#ffe6de]/95 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl shadow-pink-300/60 border border-[#ffb3c6]/80">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#2a7a76]/80 bg-[#1E615D] pl-3 pr-4 py-2.5 mb-4">
                  <StudyGoLogo className="w-10 h-10 flex-shrink-0" />
                  <span className="text-white font-bold text-lg tracking-tight lowercase">studygo</span>
                </div>
                <h2 className="text-2xl font-black text-black mb-1">
                  {mode === "login" ? "Welcome Back!" : "Join studygo"}
                </h2>
                <p className="text-black text-sm font-semibold">
                  {mode === "login" ? "Log in to continue your journey" : "Create your account to start"}
                </p>
              </div>
              <form onSubmit={handleAuth} className="space-y-4">
                {mode === "signup" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="pl-10 bg-white border-2 border-pink-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl focus:border-pink-400 focus:ring-pink-300"
                      />
                    </div>
                  </motion.div>
                )}
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-white border-2 border-pink-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl focus:border-pink-400 focus:ring-pink-300"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 bg-white border-2 border-pink-200 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl focus:border-pink-400 focus:ring-pink-300"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#ffc5d0] via-[#ff8a8a] to-[#ff9b4d] hover:from-[#ffd0da] hover:via-[#ff9b9b] hover:to-[#ffae6b] text-white font-bold rounded-xl shadow-lg shadow-pink-300/30"
                >
                  {mode === "login" ? "Log In" : "Sign Up"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-black hover:underline font-medium"
                >
                  {mode === "login" ? (
                    <>Don&apos;t have an account? <span className="font-bold">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="font-bold">Log In</span></>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="mt-4 text-xs text-black hover:underline mx-auto block font-semibold"
              >
                ← Back to home
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
