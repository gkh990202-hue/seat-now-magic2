import { useEffect, useState } from "react";

export type MemberRole = "business" | "guest";

export interface AppSession {
  role: MemberRole;
  name: string;
  phone: string;
  language: "ko" | "en" | "ja" | "zh";
  notifications: boolean;
  isOnboarded: boolean;
}

const SESSION_KEY = "seatnow.session.v1";

const DEFAULT_SESSION: AppSession = {
  role: "guest",
  name: "비회원",
  phone: "",
  language: "ko",
  notifications: true,
  isOnboarded: false,
};

export function getStoredSession(): AppSession {
  if (typeof window === "undefined") return DEFAULT_SESSION;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return DEFAULT_SESSION;
  try {
    const parsed = JSON.parse(raw) as Partial<AppSession>;
    return { ...DEFAULT_SESSION, isOnboarded: true, ...parsed };
  } catch {
    return DEFAULT_SESSION;
  }
}

export function saveSession(session: AppSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("seatnow-session"));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("seatnow-session"));
}

export function useAppSession() {
  const [session, setSession] = useState<AppSession>(DEFAULT_SESSION);

  useEffect(() => {
    const sync = () => setSession(getStoredSession());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("seatnow-session", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("seatnow-session", sync);
    };
  }, []);

  return session;
}

