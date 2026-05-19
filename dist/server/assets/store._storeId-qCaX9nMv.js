import { S as reactExports, J as jsxRuntimeExports } from "./server-DbFEfZ8R.js";
import { g as createLucideIcon, b as Route, j as useNavigate } from "./router-Dq4Yi7A5.js";
import { A as AppShell } from "./AppShell-DIzGv6BN.js";
import { a as useRealtimeTables, S as StatusDot, s as statusLabel } from "./useRealtimeTables-B8Phxu_b.js";
import { s as supabase } from "./client-BooYdwAs.js";
import { b as getStoredDoorPosition, d as getStoredDoorRotation, e as getStoredTableRotations, f as getTableLabel, g as getSeatLabel, h as getTablePosition, i as getTableSize } from "./table-layout-DP4mTr6k.js";
import { C as ChevronLeft } from "./chevron-left-C8nU7YTb.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode$1 = [
  [
    "path",
    {
      d: "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",
      key: "1r0f0z"
    }
  ],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }]
];
const MapPin = createLucideIcon("map-pin", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",
      key: "9njp5v"
    }
  ]
];
const Phone = createLucideIcon("phone", __iconNode);
const tableBg = {
  EMPTY: "bg-status-empty/15 border-status-empty/40 text-status-empty",
  OCCUPIED: "bg-status-occupied/15 border-status-occupied/40 text-status-occupied",
  CLEANING: "bg-status-cleaning/15 border-status-cleaning/40 text-status-cleaning",
  RESERVED: "bg-status-reserved/15 border-status-reserved/40 text-status-reserved"
};
function StorePage() {
  const {
    storeId
  } = Route.useParams();
  const navigate = useNavigate();
  const {
    tables,
    loading
  } = useRealtimeTables(storeId);
  const [restaurant, setRestaurant] = reactExports.useState(null);
  const [people, setPeople] = reactExports.useState(2);
  const [waitingMode, setWaitingMode] = reactExports.useState(null);
  const [selectedTableId, setSelectedTableId] = reactExports.useState(null);
  const [doorPosition, setDoorPosition] = reactExports.useState(getStoredDoorPosition);
  const [doorRotation, setDoorRotation] = reactExports.useState(getStoredDoorRotation);
  const [rotations, setRotations] = reactExports.useState(getStoredTableRotations);
  reactExports.useEffect(() => {
    (async () => {
      const {
        data
      } = await supabase.from("restaurants").select("name, address").eq("id", storeId).maybeSingle();
      if (data) setRestaurant(data);
    })();
  }, [storeId]);
  reactExports.useEffect(() => {
    const syncDoorPosition = () => setDoorPosition(getStoredDoorPosition());
    const syncDoorRotation = () => setDoorRotation(getStoredDoorRotation());
    const syncTableRotations = () => setRotations(getStoredTableRotations());
    window.addEventListener("storage", syncDoorPosition);
    window.addEventListener("seatnow-door-position", syncDoorPosition);
    window.addEventListener("storage", syncDoorRotation);
    window.addEventListener("seatnow-door-rotation", syncDoorRotation);
    window.addEventListener("storage", syncTableRotations);
    window.addEventListener("seatnow-table-rotations", syncTableRotations);
    return () => {
      window.removeEventListener("storage", syncDoorPosition);
      window.removeEventListener("seatnow-door-position", syncDoorPosition);
      window.removeEventListener("storage", syncDoorRotation);
      window.removeEventListener("seatnow-door-rotation", syncDoorRotation);
      window.removeEventListener("storage", syncTableRotations);
      window.removeEventListener("seatnow-table-rotations", syncTableRotations);
    };
  }, []);
  const counts = tables.reduce((acc, t) => ({
    ...acc,
    [t.status]: (acc[t.status] ?? 0) + 1
  }), {});
  const hasAvailableTable = (counts.EMPTY ?? 0) > 0;
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedTableIsAvailable = selectedTable?.status === "EMPTY";
  const maxPeople = Math.max(1, Math.min(4, waitingMode === "SPECIFIC" ? selectedTable?.seats ?? 4 : 4));
  const peopleOptions = Array.from({
    length: maxPeople
  }, (_, index) => index + 1);
  reactExports.useEffect(() => {
    if (people > maxPeople) {
      setPeople(maxPeople);
    }
  }, [maxPeople, people]);
  reactExports.useEffect(() => {
    if (waitingMode === "SPECIFIC" && !hasAvailableTable) {
      setWaitingMode(null);
      setSelectedTableId(null);
      return;
    }
    if (waitingMode !== "SPECIFIC") {
      setSelectedTableId(null);
      return;
    }
    if (selectedTable && !selectedTableIsAvailable) {
      setSelectedTableId(null);
    }
  }, [hasAvailableTable, selectedTable, selectedTableIsAvailable, waitingMode]);
  const selectWaitingMode = (mode) => {
    setWaitingMode(mode);
    if (mode === "ANY") {
      setSelectedTableId(null);
    }
  };
  const startAnyWaiting = () => {
    navigate({
      to: "/waiting/$storeId",
      params: {
        storeId
      },
      search: {
        people,
        mode: "ANY"
      }
    });
  };
  const startTableWaiting = () => {
    if (!selectedTableId || !selectedTableIsAvailable) return;
    navigate({
      to: "/waiting/$storeId",
      params: {
        storeId
      },
      search: {
        people,
        mode: "SPECIFIC",
        preferredTableId: selectedTableId
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-20 flex items-center gap-3 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate({
        to: "/"
      }), className: "-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "flex-1 truncate text-[15px] font-semibold", children: restaurant?.name ?? "매장" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-[11px] text-status-empty", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-1.5 w-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-status-empty opacity-75" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-1.5 w-1.5 rounded-full bg-status-empty" })
        ] }),
        "LIVE"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 rounded-3xl bg-surface p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-3xl", children: "🍜" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: restaurant?.name ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
            restaurant?.address ?? ""
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 grid grid-cols-4 gap-2", children: ["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl bg-surface px-2 py-2.5 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, { status: s }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: statusLabel[s] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-base font-bold tabular-nums", children: counts[s] ?? 0 })
      ] }, s)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-sm font-semibold", children: "웨이팅 방식 선택" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => selectWaitingMode("ANY"), className: `rounded-2xl px-4 py-4 text-left transition-colors ${waitingMode === "ANY" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold", children: "상관없음 웨이팅" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-[11px] opacity-80", children: "빠른 자리 우선" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: !hasAvailableTable, onClick: () => selectWaitingMode("SPECIFIC"), className: `rounded-2xl px-4 py-4 text-left transition-colors ${waitingMode === "SPECIFIC" ? "bg-primary text-primary-foreground" : !hasAvailableTable ? "bg-surface text-muted-foreground opacity-45" : "bg-surface text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold", children: "원하는 자리 웨이팅" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-[11px] opacity-80", children: "남은 자리 선택" })
        ] })
      ] }),
      !hasAvailableTable && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground", children: "원하는 자리 웨이팅은 이용 가능한 테이블이 있을 때만 선택할 수 있어요." })
    ] }),
    waitingMode === "SPECIFIC" && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-5 px-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-sm font-semibold", children: "실시간 테이블 현황" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-border bg-card p-3", children: [
        loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-8 text-center text-xs text-muted-foreground", children: "불러오는 중…" }) : tables.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-8 text-center text-xs text-muted-foreground", children: "테이블 정보가 없습니다." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-[320px] overflow-hidden rounded-2xl border border-border/60 bg-background/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DoorMarker, { position: doorPosition, rotation: doorRotation }),
          tables.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(TableCard, { table: t, rotation: rotations[t.id] ?? 0, selected: selectedTableId === t.id, disabled: t.status !== "EMPTY", onSelect: () => setSelectedTableId(t.id) }, t.id))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-muted-foreground", children: "이용 가능한 테이블만 선택할 수 있어요." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 px-5", children: [
      waitingMode === "ANY" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium text-primary", children: "상관없음 웨이팅" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "자리 종류와 상관없이 가능한 자리부터 안내받아요." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PeopleSelector, { people, peopleOptions, onChange: setPeople }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: startAnyWaiting, className: "mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.99]", children: [
          people,
          "명 상관없음 웨이팅 등록"
        ] })
      ] }),
      waitingMode === "SPECIFIC" && (selectedTable ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium text-primary", children: "선택한 테이블" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-bold", children: getTableLabel(selectedTable) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: getSeatLabel(selectedTable) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground", children: statusLabel[selectedTable.status] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PeopleSelector, { people, peopleOptions, onChange: setPeople }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-muted-foreground", children: "원하는 자리 웨이팅은 4인 이하만 가능합니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: startTableWaiting, disabled: !selectedTableIsAvailable, className: "mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.99] disabled:opacity-40", children: [
          getTableLabel(selectedTable),
          " ",
          people,
          "명 웨이팅 등록"
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-5 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "남아있는 테이블을 선택해주세요" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "실시간 테이블 현황에서 이용 가능한 테이블을 누르면 인원을 선택할 수 있어요." })
      ] })),
      !waitingMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-5 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold", children: "웨이팅 방식을 먼저 선택해주세요" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "원하는 자리는 남은 테이블이 있을 때만 선택할 수 있어요." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "tel:0428265334", className: "mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-medium text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4" }),
        "5인 이상 단체예약 문의"
      ] })
    ] })
  ] });
}
function DoorMarker({
  position,
  rotation
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`
  }, className: "absolute z-10 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 shadow-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
    transform: `rotate(${-rotation}deg)`
  }, className: "block text-[11px] font-bold text-primary", children: "출입문" }) });
}
function PeopleSelector({
  people,
  peopleOptions,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-sm font-semibold", children: "인원 선택" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: peopleOptions.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => onChange(n), className: `h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${people === n ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`, children: [
      n,
      "명"
    ] }, n)) })
  ] });
}
function TableCard({
  table,
  rotation,
  selected,
  disabled,
  onSelect
}) {
  const position = getTablePosition(table);
  const size = getTableSize(table);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onSelect, disabled, style: {
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${size.w}%`,
    height: `${size.h}%`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`
  }, className: `absolute min-h-[72px] min-w-[92px] rounded-2xl border p-2.5 text-left shadow-card transition ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""} ${disabled ? "cursor-not-allowed opacity-55" : "active:scale-[0.98]"} ${tableBg[table.status]}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
    transform: `rotate(${-rotation}deg)`
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: getTableLabel(table) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px] font-medium", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusDot, { status: table.status, pulse: table.status === "OCCUPIED" }),
        statusLabel[table.status]
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] opacity-80", children: getSeatLabel(table) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-semibold tabular-nums", children: table.status === "OCCUPIED" ? "이용중" : table.status === "CLEANING" ? "정리중" : table.status === "RESERVED" ? "예약됨" : "이용 가능" })
    ] })
  ] }) });
}
export {
  StorePage as component
};
