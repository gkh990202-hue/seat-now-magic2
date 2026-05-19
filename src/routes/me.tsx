import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Globe, Store, ChevronRight, LogOut } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { clearSession, saveSession, useAppSession, type AppSession } from "@/lib/auth-session";

export const Route = createFileRoute("/me")({
  component: MePage,
});

const PLACE_URL = "https://naver.me/FgHDfJTv";
const languages: Array<{ value: AppSession["language"]; label: string }> = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];

function MePage() {
  const navigate = useNavigate();
  const session = useAppSession();
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState<AppSession["language"]>("ko");

  useEffect(() => {
    setNotifications(session.notifications);
    setLanguage(session.language);
  }, [session]);

  const updateProfile = (patch: Partial<AppSession>) => {
    saveSession({ ...session, ...patch });
  };

  const logout = () => {
    clearSession();
    navigate({ to: "/auth" });
  };

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-4">
        <h1 className="text-[22px] font-bold tracking-tight">내정보</h1>
      </header>

      <section className="px-5">
        <div className="overflow-hidden rounded-3xl bg-surface">
          <button
            onClick={() => {
              const next = !notifications;
              setNotifications(next);
              updateProfile({ notifications: next });
            }}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">알림 설정</span>
            <span className="text-xs font-semibold text-primary">
              {notifications ? "켜짐" : "꺼짐"}
            </span>
          </button>
          <a
            href={PLACE_URL}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left"
          >
            <Store className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">매장 둘러보기</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
          <div className="flex w-full items-center gap-3 px-4 py-4 text-left">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm">언어 설정</span>
            <select
              value={language}
              onChange={(event) => {
                const next = event.target.value as AppSession["language"];
                setLanguage(next);
                updateProfile({ language: next });
              }}
              className="rounded-xl bg-background px-2 py-1 text-xs text-foreground outline-none ring-1 ring-border"
            >
              {languages.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {session.role === "guest" && (
          <Link
            to="/auth"
            className="mt-4 flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground"
          >
            로그인 / 회원가입
          </Link>
        )}

        <button
          onClick={logout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-4 text-sm text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </button>
      </section>
    </AppShell>
  );
}
