import { S as reactExports, J as jsxRuntimeExports } from "./server-DbFEfZ8R-BI0li19e.js";
import { u as useAppSession, A as AuthPage, L as Link, g as createLucideIcon } from "./router-Dq4Yi7A5-BEoTr15r.js";
import { A as AppShell, C as Clock } from "./AppShell-DIzGv6BN-CHbiqRc7.js";
import { s as supabase } from "./client-BooYdwAs-Jckt6Bjm.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$2 = [
  ["path", { d: "m21 21-4.34-4.34", key: "14j7rj" }],
  ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }]
];
const Search = createLucideIcon("search", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "M10 5H3", key: "1qgfaw" }],
  ["path", { d: "M12 19H3", key: "yhmn1j" }],
  ["path", { d: "M14 3v4", key: "1sua03" }],
  ["path", { d: "M16 17v4", key: "1q0r14" }],
  ["path", { d: "M21 12h-9", key: "1o4lsq" }],
  ["path", { d: "M21 19h-5", key: "1rlt1p" }],
  ["path", { d: "M21 5h-7", key: "1oszz2" }],
  ["path", { d: "M8 10v4", key: "tgpxqk" }],
  ["path", { d: "M8 12H3", key: "a7s4jb" }]
];
const SlidersHorizontal = createLucideIcon("sliders-horizontal", __iconNode$1);
const __iconNode = [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["path", { d: "M16 3.128a4 4 0 0 1 0 7.744", key: "16gr8j" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }]
];
const Users = createLucideIcon("users", __iconNode);
const LOAD_TIMEOUT_MS = 5e3;
function HomePage() {
  const session = useAppSession();
  const [restaurants, setRestaurants] = reactExports.useState([]);
  const [tables, setTables] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [loadError, setLoadError] = reactExports.useState(null);
  const [now, setNow] = reactExports.useState(null);
  reactExports.useEffect(() => {
    setNow(/* @__PURE__ */ new Date());
    const i = setInterval(() => setNow(/* @__PURE__ */ new Date()), 3e4);
    return () => clearInterval(i);
  }, []);
  reactExports.useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setLoadError((prev) => prev ?? "요청 시간이 초과되었습니다 (5초)");
    }, LOAD_TIMEOUT_MS);
    (async () => {
      try {
        const [rRes, tRes] = await Promise.all([supabase.from("restaurants").select("id, name, address").order("created_at"), supabase.from("restaurant_tables").select("id, restaurant_id, status")]);
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
        setRestaurants(rRes.data ?? []);
        setTables(tRes.data ?? []);
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
    const ch = supabase.channel("home:tables").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "restaurant_tables"
    }, (payload) => {
      setTables((prev) => {
        if (payload.eventType === "INSERT") return [...prev, payload.new];
        if (payload.eventType === "UPDATE") return prev.map((t) => t.id === payload.new.id ? payload.new : t);
        if (payload.eventType === "DELETE") return prev.filter((t) => t.id !== payload.old.id);
        return prev;
      });
    }).subscribe();
    return () => {
      active = false;
      window.clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, []);
  const cards = reactExports.useMemo(() => {
    return restaurants.map((r) => {
      const ts = tables.filter((t) => t.restaurant_id === r.id);
      const empty = ts.filter((t) => t.status === "EMPTY").length;
      return {
        ...r,
        empty,
        total: ts.length
      };
    });
  }, [restaurants, tables]);
  const totalEmpty = cards.reduce((a, c) => a + c.empty, 0);
  if (!session.isOnboarded) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPage, {});
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-20 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-0.5 text-[22px] font-bold tracking-tight", children: [
          "지금 ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "바로 입장" }),
          " 가능한 곳"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { suppressHydrationWarning: true, className: "text-[10px] text-muted-foreground", children: now ? `${now.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit"
        })} 기준` : "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "매장이나 메뉴를 검색하세요", className: "flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "px-5 pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "실시간 매장", value: cards.length.toString() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "잔여 좌석", value: totalEmpty.toString(), tone: "empty" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "총 테이블", value: cards.reduce((a, c) => a + c.total, 0).toString() })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-4 flex flex-col gap-2.5 px-5", children: [
      loadError && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-6 text-center text-sm text-destructive", children: [
        "매장 로딩 실패: ",
        loadError
      ] }),
      !loadError && loading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted-foreground", children: "매장 불러오는 중…" }),
      !loadError && !loading && cards.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-2xl bg-surface px-4 py-6 text-center text-sm text-muted-foreground", children: "등록된 매장이 없습니다." }),
      cards.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/store/$storeId", params: {
        storeId: r.id
      }, className: "block fade-in-up", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 rounded-2xl border border-border bg-card p-4 transition-all active:scale-[0.99] hover:border-primary/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-4xl", children: "🍜" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "truncate text-[15px] font-semibold", children: r.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${r.empty > 0 ? "bg-status-empty/15 text-status-empty" : "bg-status-occupied/15 text-status-occupied"}`, children: r.empty > 0 ? "여유" : "만석" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: r.address ?? "" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2.5 flex items-center gap-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3 w-3" }),
              "잔여 ",
              r.empty,
              "/",
              r.total
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `flex items-center gap-1 ${r.empty > 0 ? "text-status-empty" : "text-status-occupied"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
              r.empty > 0 ? "바로 입장" : "대기 필요"
            ] })
          ] })
        ] })
      ] }) }, r.id))
    ] })
  ] });
}
function Stat({
  label,
  value,
  tone
}) {
  const toneCls = tone === "empty" ? "text-status-empty" : tone === "occupied" ? "text-status-occupied" : "text-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-surface px-3 py-2.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-0.5 text-lg font-bold tabular-nums ${toneCls}`, children: value })
  ] });
}
export {
  HomePage as component
};
