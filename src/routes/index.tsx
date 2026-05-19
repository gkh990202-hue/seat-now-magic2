import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Users, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import type { TableStatus } from "@/lib/mock-data";
import { useAppSession } from "@/lib/auth-session";
import { AuthPage } from "@/routes/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SeatNow — 실시간 식당 자리 현황" },
      { name: "description", content: "줄 서지 마세요. 실시간 자리 현황과 원격 웨이팅을 한 번에." },
    ],
  }),
  component: HomePage,
});

interface RestaurantRow {
  id: string;
  name: string;
  address: string | null;
}
interface TableRow {
  id: string;
  restaurant_id: string;
  status: TableStatus;
}

const LOAD_TIMEOUT_MS = 5_000;

function HomePage() {
  const session = useAppSession();
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setLoadError((prev) => prev ?? "요청 시간이 초과되었습니다 (5초)");
    }, LOAD_TIMEOUT_MS);

    (async () => {
      try {
        const [rRes, tRes] = await Promise.all([
          supabase.from("restaurants").select("id, name, address").order("created_at"),
          supabase.from("restaurant_tables").select("id, restaurant_id, status"),
        ]);
        if (!active) return;
        window.clearTimeout(timer);
        if (rRes.error) {
          console.error("[HomePage] restaurants", rRes.error.message);
          setLoadError(rRes.error.message);
          setLoading(false);
          return;
        }
        if (tRes.error) {
          console.error("[HomePage] restaurant_tables", tRes.error.message);
          setLoadError(tRes.error.message);
          setLoading(false);
          return;
        }
        setRestaurants((rRes.data ?? []) as RestaurantRow[]);
        setTables((tRes.data ?? []) as TableRow[]);
        setLoading(false);
      } catch (e) {
        if (!active) return;
        window.clearTimeout(timer);
        const message = e instanceof Error ? e.message : "알 수 없는 오류";
        console.error("[HomePage]", message);
        setLoadError(message);
        setLoading(false);
      }
    })();

    const ch = supabase
      .channel("home:tables")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurant_tables" },
        (payload) => {
          setTables((prev) => {
            if (payload.eventType === "INSERT") return [...prev, payload.new as TableRow];
            if (payload.eventType === "UPDATE")
              return prev.map((t) =>
                t.id === (payload.new as TableRow).id ? (payload.new as TableRow) : t,
              );
            if (payload.eventType === "DELETE")
              return prev.filter((t) => t.id !== (payload.old as TableRow).id);
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      active = false;
      window.clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, []);

  const cards = useMemo(() => {
    return restaurants.map((r) => {
      const ts = tables.filter((t) => t.restaurant_id === r.id);
      const empty = ts.filter((t) => t.status === "EMPTY").length;
      return { ...r, empty, total: ts.length };
    });
  }, [restaurants, tables]);

  const totalEmpty = cards.reduce((a, c) => a + c.empty, 0);

  if (!session.isOnboarded) {
    return <AuthPage />;
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-20 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mt-0.5 text-[22px] font-bold tracking-tight">
              지금 <span className="text-primary">바로 입장</span> 가능한 곳
            </h1>
          </div>
          <span suppressHydrationWarning className="text-[10px] text-muted-foreground">
            {now
              ? `${now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} 기준`
              : ""}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="매장이나 메뉴를 검색하세요"
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="px-5 pt-2">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="실시간 매장" value={cards.length.toString()} />
          <Stat label="잔여 좌석" value={totalEmpty.toString()} tone="empty" />
          <Stat label="총 테이블" value={cards.reduce((a, c) => a + c.total, 0).toString()} />
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-2.5 px-5">
        {loadError && (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive">
            매장 로딩 실패: {loadError}
          </p>
        )}
        {!loadError && loading && (
          <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
            매장 불러오는 중…
          </p>
        )}
        {!loadError && !loading && cards.length === 0 && (
          <p className="rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted-foreground">
            등록된 매장이 없습니다.
          </p>
        )}
        {cards.map((r) => (
          <Link
            key={r.id}
            to="/store/$storeId"
            params={{ storeId: r.id }}
            className="block fade-in-up"
          >
            <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-all active:scale-[0.99] hover:border-primary/40">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-4xl">
                🍜
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="truncate text-[15px] font-semibold">{r.name}</h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      r.empty > 0
                        ? "bg-status-empty/15 text-status-empty"
                        : "bg-status-occupied/15 text-status-occupied"
                    }`}
                  >
                    {r.empty > 0 ? "여유" : "만석"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{r.address ?? ""}</p>
                <div className="mt-2.5 flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-3 w-3" />
                    잔여 {r.empty}/{r.total}
                  </span>
                  <span
                    className={`flex items-center gap-1 ${
                      r.empty > 0 ? "text-status-empty" : "text-status-occupied"
                    }`}
                  >
                    <Clock className="h-3 w-3" />
                    {r.empty > 0 ? "바로 입장" : "대기 필요"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "empty" | "occupied";
}) {
  const toneCls =
    tone === "empty"
      ? "text-status-empty"
      : tone === "occupied"
        ? "text-status-occupied"
        : "text-foreground";
  return (
    <div className="rounded-2xl bg-surface px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${toneCls}`}>{value}</p>
    </div>
  );
}
