import { S as reactExports, J as jsxRuntimeExports } from "./server-DbFEfZ8R-BI0li19e.js";
import { j as useNavigate, u as useAppSession, L as Link, s as saveSession, g as createLucideIcon, e as clearSession } from "./router-Dq4Yi7A5-BEoTr15r.js";
import { A as AppShell } from "./AppShell-DIzGv6BN-CHbiqRc7.js";
import { B as Bell } from "./bell-DUlaBP8w-Cl1MQZWd.js";
import { C as ChevronRight } from "./chevron-right-B6tYBXPs-DLaqdjDz.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$2 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["path", { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" }],
  ["path", { d: "M2 12h20", key: "9i4pu4" }]
];
const Globe = createLucideIcon("globe", __iconNode$2);
const __iconNode$1 = [
  ["path", { d: "m16 17 5-5-5-5", key: "1bji2h" }],
  ["path", { d: "M21 12H9", key: "dn1m92" }],
  ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }]
];
const LogOut = createLucideIcon("log-out", __iconNode$1);
const __iconNode = [
  ["path", { d: "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5", key: "slp6dd" }],
  [
    "path",
    {
      d: "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244",
      key: "o0xfot"
    }
  ],
  ["path", { d: "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05", key: "wn3emo" }]
];
const Store = createLucideIcon("store", __iconNode);
const PLACE_URL = "https://naver.me/FgHDfJTv";
const languages = [{
  value: "ko",
  label: "한국어"
}, {
  value: "en",
  label: "English"
}, {
  value: "ja",
  label: "日本語"
}, {
  value: "zh",
  label: "中文"
}];
function MePage() {
  const navigate = useNavigate();
  const session = useAppSession();
  const [notifications, setNotifications] = reactExports.useState(true);
  const [language, setLanguage] = reactExports.useState("ko");
  reactExports.useEffect(() => {
    setNotifications(session.notifications);
    setLanguage(session.language);
  }, [session]);
  const updateProfile = (patch) => {
    saveSession({
      ...session,
      ...patch
    });
  };
  const logout = () => {
    clearSession();
    navigate({
      to: "/auth"
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "px-5 pt-12 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[22px] font-bold tracking-tight", children: "내정보" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-3xl bg-surface", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
          const next = !notifications;
          setNotifications(next);
          updateProfile({
            notifications: next
          });
        }, className: "flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm", children: "알림 설정" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-primary", children: notifications ? "켜짐" : "꺼짐" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: PLACE_URL, target: "_blank", rel: "noreferrer", className: "flex w-full items-center gap-3 border-b border-border px-4 py-4 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm", children: "매장 둘러보기" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center gap-3 px-4 py-4 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm", children: "언어 설정" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: language, onChange: (event) => {
            const next = event.target.value;
            setLanguage(next);
            updateProfile({
              language: next
            });
          }, className: "rounded-xl bg-background px-2 py-1 text-xs text-foreground outline-none ring-1 ring-border", children: languages.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: item.value, children: item.label }, item.value)) })
        ] })
      ] }),
      session.role === "guest" && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/auth", className: "mt-4 flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground", children: "로그인 / 회원가입" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: logout, className: "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface py-4 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
        "로그아웃"
      ] })
    ] })
  ] });
}
export {
  MePage as component
};
