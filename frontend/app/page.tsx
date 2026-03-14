"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { api } from "@/lib/api/client";

export default function Home() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("return_url") ?? "/Dashboard";

  const [showAuth, setShowAuth] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleEnter = () => {
    setAuthError(null);
    setShowAuth(true);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (mode === "login") {
        const { user, error } = await api.auth.login(formData.email, formData.password);
        if (error) {
          setAuthError(error);
          setAuthLoading(false);
          return;
        }
        if (user) window.location.href = returnUrl;
        return;
      }
      const { user: signupUser, error: signupError } = await api.auth.signup(
        formData.email,
        formData.password,
        formData.name || undefined
      );
      if (signupError) {
        setAuthError(signupError);
        setAuthLoading(false);
        return;
      }
      if (signupUser) {
        const { error: loginError } = await api.auth.login(formData.email, formData.password);
        if (!loginError) {
          window.location.href = returnUrl;
          return;
        }
      }
      setAuthError(null);
      setAuthLoading(false);
      setMode("login");
    } catch {
      setAuthError("Something went wrong. Try again.");
      setAuthLoading(false);
    }
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
              <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 mb-3 drop-shadow-lg">
                StudyQuest
              </h1>
              <p className="text-slate-700 text-lg font-semibold">
                Learn. Play.{" "}
                <span className="text-pink-600 font-black">Conquer.</span>
              </p>
            </motion.div>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-3 gap-3 mb-8"
            >
              {[
                { icon: GraduationCap, label: "Course Based", color: "from-cyan-500 to-blue-600" },
                { icon: Zap, label: "Interactive", color: "from-yellow-500 to-orange-600" },
                { icon: Star, label: "Leaderboard", color: "from-pink-500 to-rose-600" },
              ].map((feat, i) => (
                <motion.div
                  key={feat.label}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring" }}
                  className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4 text-center"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mx-auto mb-2 shadow-lg`}>
                    <feat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[11px] font-bold text-slate-700">{feat.label}</p>
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
                className="w-full h-14 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Enter StudyQuest
              </Button>
              <p className="text-center text-xs text-slate-600/80 font-medium mt-3">
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
            <div className="bg-white/90 backdrop-blur-2xl border-4 border-pink-300 rounded-3xl p-8 shadow-2xl shadow-pink-500/30">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/30 mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-1">
                  {mode === "login" ? "Welcome Back!" : "Join StudyQuest"}
                </h2>
                <p className="text-slate-600 text-sm font-semibold">
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
                {authError && (
                  <p className="text-sm text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                    {authError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={authLoading}
                  className="w-full h-12 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {authLoading ? "Please wait…" : mode === "login" ? "Log In" : "Sign Up"}
                  {!authLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "login" ? "signup" : "login");
                    setAuthError(null);
                  }}
                  className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium"
                >
                  {mode === "login" ? (
                    <>Don&apos;t have an account? <span className="text-pink-600 font-bold">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-orange-600 font-bold">Log In</span></>
                  )}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowAuth(false)}
                className="mt-4 text-xs text-slate-500 hover:text-slate-700 transition-colors mx-auto block font-semibold"
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
