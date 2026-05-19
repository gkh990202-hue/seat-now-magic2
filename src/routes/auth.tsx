import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, UserRound } from "lucide-react";
import { saveSession } from "@/lib/auth-session";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

const OWNER_ID = "온반";
const OWNER_PASSWORD = ["984", "322"].join("");

export function AuthPage() {
  const navigate = useNavigate();
  const [ownerId, setOwnerId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginBusiness = () => {
    setError(null);
    if (ownerId.trim() !== OWNER_ID || password !== OWNER_PASSWORD) {
      setError("사업자 아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    saveSession({
      role: "business",
      name: "온반 관리자",
      phone: "",
      language: "ko",
      notifications: true,
      isOnboarded: true,
    });
    navigate({ to: "/admin" });
  };

  const continueAsGuest = () => {
    saveSession({
      role: "guest",
      name: "비회원",
      phone: "",
      language: "ko",
      notifications: true,
      isOnboarded: true,
    });
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col justify-center bg-background px-5 py-10">
        <header className="pb-6">
          <p className="text-xs font-semibold text-primary">SeatNow 온반</p>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight">어떻게 이용하시나요?</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            홈 화면으로 들어가기 전에 이용 방식을 선택해주세요.
          </p>
        </header>

        <button
          onClick={continueAsGuest}
          className="flex min-h-[136px] w-full flex-col items-center justify-center rounded-3xl bg-primary px-6 py-7 text-center text-primary-foreground shadow-glow transition-transform active:scale-[0.99]"
        >
          <UserRound className="mb-3 h-8 w-8" />
          <span className="text-xl font-bold">비회원 웨이팅 등록</span>
          <span className="mt-2 text-sm opacity-85">로그인 없이 바로 온반 웨이팅을 시작해요</span>
        </button>

        <details className="mt-5 rounded-2xl border border-border bg-surface/70 p-3">
          <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            사업자 로그인
          </summary>
          <div className="mt-4">
            <label className="text-xs text-muted-foreground">
              사업자 아이디
              <input
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                placeholder="사업자 아이디 입력"
                className="mt-2 h-11 w-full rounded-2xl bg-background px-4 text-sm outline-none ring-1 ring-border focus:ring-primary"
              />
            </label>
            <label className="mt-3 block text-xs text-muted-foreground">
              비밀번호
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                type="password"
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-2xl bg-background px-4 text-sm outline-none ring-1 ring-border focus:ring-primary"
              />
            </label>
            {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
            <button
              onClick={loginBusiness}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-2xl bg-surface-elevated text-xs font-semibold text-foreground"
            >
              사장님 화면으로 접속
            </button>
          </div>
        </details>
      </main>
    </div>
  );
}
