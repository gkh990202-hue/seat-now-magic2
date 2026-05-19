import { a4 as useRouter, J as jsxRuntimeExports } from "./server-DbFEfZ8R.js";
import { g as createLucideIcon, u as useAppSession, L as Link } from "./router-Dq4Yi7A5.js";
function useRouterState(opts) {
  const contextRouter = useRouter({ warn: opts?.router === void 0 });
  const router = opts?.router || contextRouter;
  {
    const state = router.stores.__store.get();
    return opts?.select ? opts.select(state) : state;
  }
}
const __iconNode$4 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }]
];
const Clock = createLucideIcon("clock", __iconNode$4);
const __iconNode$3 = [
  ["path", { d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", key: "5wwlr5" }],
  [
    "path",
    {
      d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
      key: "r6nss1"
    }
  ]
];
const House = createLucideIcon("house", __iconNode$3);
const __iconNode$2 = [
  ["rect", { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" }],
  ["rect", { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" }],
  ["rect", { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" }],
  ["rect", { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" }]
];
const LayoutDashboard = createLucideIcon("layout-dashboard", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "m10 17 5-5-5-5", key: "1bsop3" }],
  ["path", { d: "M15 12H3", key: "6jk70r" }],
  ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }]
];
const LogIn = createLucideIcon("log-in", __iconNode$1);
const __iconNode = [
  ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
  ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }]
];
const User = createLucideIcon("user", __iconNode);
const tabs = [
  { to: "/", icon: House, label: "홈" },
  { to: "/waiting", icon: Clock, label: "내 웨이팅" },
  { to: "/admin", icon: LayoutDashboard, label: "사장님" },
  { to: "/me", icon: User, label: "내정보" }
];
function AppShell({ children }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useAppSession();
  const visibleTabs = session.role === "business" ? tabs.filter((tab) => tab.to === "/admin" || tab.to === "/me") : tabs.filter((tab) => tab.to !== "/admin");
  const navTabs = session.role === "guest" ? [...visibleTabs.slice(0, 3), { to: "/auth", icon: LogIn, label: "로그인" }] : visibleTabs;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex min-h-screen w-full max-w-[480px] flex-col bg-background pb-20", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-border bg-surface/90 backdrop-blur-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid", style: { gridTemplateColumns: `repeat(${navTabs.length}, minmax(0, 1fr))` }, children: navTabs.map((t) => {
      const active = pathname === t.to || t.to !== "/" && pathname.startsWith(t.to);
      const Icon = t.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: t.to,
          className: `flex flex-col items-center gap-1 py-3 text-[11px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5", strokeWidth: active ? 2.4 : 1.8 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: active ? "font-semibold" : "", children: t.label })
          ]
        }
      ) }, t.to);
    }) }) })
  ] });
}
export {
  AppShell as A,
  Clock as C
};
