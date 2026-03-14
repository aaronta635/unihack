"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
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
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 mx-auto">
                  <Gamepad2 className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              <h1 className="text-5xl md:text-6xl font-black text-[#4a2b3e] mb-3 drop-shadow-lg">
                StudyQuest
              </h1>
              <p className="text-[#e6e6e6] text-lg font-semibold">
                Learn. Play.{" "}
                <span className="text-[#6b5bff] font-black">Conquer.</span>
              </p>
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              {[
                { icon: GraduationCap, label: "Course Based", color: "from-[#ffc5d0] to-[#ff8a8a]" },
                { icon: Zap, label: "Interactive", color: "from-[#ff8a8a] to-[#ff9b4d]" },
                { icon: Star, label: "Leaderboard", color: "from-[#ff9b4d] to-[#6b5bff]" },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="bg-[#3b2a26]/90 backdrop-blur rounded-2xl p-4 text-center shadow-[0_18px_45px_rgba(0,0,0,0.35)]"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <feat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-bold text-[#f5f5f5]">{feat.label}</p>
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
                className="w-full h-14 bg-gradient-to-r from-[#ffc5d0] via-[#ff8a8a] to-[#6b5bff] hover:from-[#ffd0da] hover:via-[#ff9b9b] hover:to-[#8471ff] text-white font-bold text-lg rounded-2xl shadow-2xl shadow-black/40 transition-all duration-300 hover:shadow-black/60 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Enter StudyQuest
              </Button>
              <p className="text-center text-xs text-[#6e6e6e] font-medium mt-3">
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ffc5d0] via-[#ff8a8a] to-[#6b5bff] flex items-center justify-center shadow-xl shadow-black/60 mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-[#4a2b3e] mb-1">
                  {mode === "login" ? "Welcome Back!" : "Join StudyQuest"}
                </h2>
                <p className="text-[#6e6e6e] text-sm font-semibold">
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
                        className="pl-10 bg-[#4a3832] border border-[#6b5548] text-[#f5f5f5] placeholder:text-[#9e9e9e] h-12 rounded-xl focus:border-[#ff9b4d] focus:ring-[#ff9b4d]/40"
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
                    className="pl-10 bg-[#4a3832] border border-[#6b5548] text-[#f5f5f5] placeholder:text-[#9e9e9e] h-12 rounded-xl focus:border-[#ff9b4d] focus:ring-[#ff9b4d]/40"
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
                    className="pl-10 bg-[#4a3832] border border-[#6b5548] text-[#f5f5f5] placeholder:text-[#9e9e9e] h-12 rounded-xl focus:border-[#ff9b4d] focus:ring-[#ff9b4d]/40"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#ffc5d0] via-[#ff8a8a] to-[#6b5bff] hover:from-[#ffd0da] hover:via-[#ff9b9b] hover:to-[#8471ff] text-white font-bold rounded-xl shadow-lg shadow-black/40"
                >
                  {mode === "login" ? "Log In" : "Sign Up"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-[#6e6e6e] hover:text-[#f5f5f5] transition-colors font-medium"
                >
                  {mode === "login" ? (
                    <>Don&apos;t have an account? <span className="text-[#ff8a8a] font-bold">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-[#6b5bff] font-bold">Log In</span></>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="mt-4 text-xs text-[#6e6e6e] hover:text-[#f5f5f5] transition-colors mx-auto block font-semibold"
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
