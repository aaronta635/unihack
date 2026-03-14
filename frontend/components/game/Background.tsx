"use client";

import { motion } from "framer-motion";

const floatingShapes = [
  {
    size: 60,
    color: "from-pink-400 to-purple-500",
    x: "10%",
    y: "20%",
    delay: 0,
  },
  {
    size: 40,
    color: "from-cyan-400 to-blue-500",
    x: "80%",
    y: "15%",
    delay: 0.5,
  },
  {
    size: 50,
    color: "from-yellow-400 to-orange-500",
    x: "70%",
    y: "70%",
    delay: 1,
  },
  {
    size: 35,
    color: "from-green-400 to-teal-500",
    x: "20%",
    y: "75%",
    delay: 1.5,
  },
  {
    size: 45,
    color: "from-pink-500 to-rose-500",
    x: "50%",
    y: "10%",
    delay: 0.8,
  },
  {
    size: 30,
    color: "from-violet-400 to-indigo-500",
    x: "90%",
    y: "50%",
    delay: 1.2,
  },
];

export default function AnimeBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-orange-200 to-cyan-300" />
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/40 rounded-full blur-2xl"
            style={{
              width: `${150 + Math.random() * 100}px`,
              height: `${60 + Math.random() * 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
            }}
            animate={{
              x: [0, 100, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            y: [0, -50, 0, 50, 0],
            x: [0, 30, 0, -30, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            delay: shape.delay,
            ease: "easeInOut",
          }}
        >
          <div
            className={`w-3 h-3 bg-gradient-to-br ${shape.color} rounded-full opacity-60`}
          />
        </motion.div>
      ))}
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        >
          <div className="w-1 h-1 bg-yellow-300 rounded-full" />
        </motion.div>
      ))}
      <div className="absolute inset-0 opacity-20">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`ray-${i}`}
            className="absolute bg-gradient-to-b from-yellow-200/50 to-transparent"
            style={{
              width: "2px",
              height: "100%",
              left: `${20 + i * 20}%`,
              transform: "skewX(-15deg)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
