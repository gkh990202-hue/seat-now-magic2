import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Clock, LayoutDashboard, User, LogIn } from "lucide-react";
import { useAppSession } from "@/lib/auth-session";

const tabs = [
  { to: "/", icon: Home, label: "홈" },
  { to: "/waiting", icon: Clock, label: "내 웨이팅" },
  { to: "/admin", icon: LayoutDashboard, label: "사장님" },
  { to: "/me", icon: User, label: "내정보" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useAppSession();
  const visibleTabs =
    session.role === "business"
      ? tabs.filter((tab) => tab.to === "/admin" || tab.to === "/me")
      : tabs.filter((tab) => tab.to !== "/admin");
  const navTabs =
    session.role === "guest"
      ? [...visibleTabs.slice(0, 3), { to: "/auth", icon: LogIn, label: "로그인" } as const]
      : visibleTabs;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background pb-20">
        {children}
      </div>
      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface/90 backdrop-blur-xl">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${navTabs.length}, minmax(0, 1fr))` }}>
          {navTabs.map((t) => {
            const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={`flex flex-col items-center gap-1 py-3 text-[11px] transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className={active ? "font-semibold" : ""}>{t.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
