"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { DEFAULT_PERSONALITY_KEY } from "@/lib/tutorPersonalities";
import type { TutorResponseMode } from "@/components/TutorResponseModeToggle";

const STORAGE_KEY_PERSONALITY = "tutorPersonality";
const STORAGE_KEY_MODE = "tutorResponseMode";

type TutorSettingsContextValue = {
  personalityKey: string;
  setPersonalityKey: (key: string) => void;
  responseMode: TutorResponseMode;
  setResponseMode: (mode: TutorResponseMode) => void;
};

const TutorSettingsContext = createContext<TutorSettingsContextValue | null>(null);

function loadStored<T>(key: string, fallback: T, validate: (v: unknown) => v is T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return validate(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function saveStored(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function TutorSettingsProvider({ children }: { children: ReactNode }) {
  const [personalityKey, setPersonalityKeyState] = useState<string>(() =>
    loadStored(STORAGE_KEY_PERSONALITY, DEFAULT_PERSONALITY_KEY, (v): v is string => typeof v === "string")
  );
  const [responseMode, setResponseModeState] = useState<TutorResponseMode>(() =>
    loadStored(STORAGE_KEY_MODE, "text", (v): v is TutorResponseMode => v === "text" || v === "voice")
  );

  const setPersonalityKey = useCallback((key: string) => {
    setPersonalityKeyState(key);
    saveStored(STORAGE_KEY_PERSONALITY, key);
  }, []);

  const setResponseMode = useCallback((mode: TutorResponseMode) => {
    setResponseModeState(mode);
    saveStored(STORAGE_KEY_MODE, mode);
  }, []);

  useEffect(() => {
    setPersonalityKeyState((prev) =>
      loadStored(STORAGE_KEY_PERSONALITY, prev, (v): v is string => typeof v === "string")
    );
    setResponseModeState((prev) =>
      loadStored(STORAGE_KEY_MODE, prev, (v): v is TutorResponseMode => v === "text" || v === "voice")
    );
  }, []);

  const value: TutorSettingsContextValue = {
    personalityKey,
    setPersonalityKey,
    responseMode,
    setResponseMode,
  };

  return (
    <TutorSettingsContext.Provider value={value}>
      {children}
    </TutorSettingsContext.Provider>
  );
}

export function useTutorSettings(): TutorSettingsContextValue {
  const ctx = useContext(TutorSettingsContext);
  if (!ctx) throw new Error("useTutorSettings must be used within TutorSettingsProvider");
  return ctx;
}
