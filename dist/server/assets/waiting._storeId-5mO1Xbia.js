import { S as reactExports, J as jsxRuntimeExports } from "./server-DbFEfZ8R.js";
import { g as createLucideIcon, a as Route, j as useNavigate, u as useAppSession, L as Link } from "./router-Dq4Yi7A5.js";
import { A as AppShell } from "./AppShell-DIzGv6BN.js";
import { s as supabase } from "./client-BooYdwAs.js";
import { f as getTableLabel, g as getSeatLabel } from "./table-layout-DP4mTr6k.js";
import { i as isWaitingPreferenceSchemaError, n as normalizeWaitingPreference, e as encodeFallbackWaitingPhone } from "./waiting-preferences-DPgt-__X.js";
import { r as rememberWaitingEntry, f as forgetWaitingEntry } from "./my-waiting-entries-mW30yyoy.js";
import { g as getWaitingNotificationChannelName, W as WAITING_NOTIFICATION_EVENT, C as Check } from "./waiting-notifications-DWE5T3WN.js";
import { C as ChevronLeft } from "./chevron-left-C8nU7YTb.js";
import { B as Bell } from "./bell-DUlaBP8w.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const __iconNode = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
];
const X = createLucideIcon("x", __iconNode);
function WaitingPage() {
  const {
    storeId
  } = Route.useParams();
  const {
    people,
    entryId,
    mode,
    preferredTableId
  } = Route.useSearch();
  const navigate = useNavigate();
  const session = useAppSession();
  const lockedSeatingPreference = mode === "SPECIFIC" || preferredTableId ? "SPECIFIC" : mode === "ANY" ? "ANY" : null;
  const [phase, setPhase] = reactExports.useState(entryId ? "waiting" : "register");
  const [phone, setPhone] = reactExports.useState("");
  const [restaurant, setRestaurant] = reactExports.useState(null);
  const [tables, setTables] = reactExports.useState([]);
  const [waitingCount, setWaitingCount] = reactExports.useState(0);
  const [order, setOrder] = reactExports.useState(1);
  const [tableOrder, setTableOrder] = reactExports.useState(null);
  const [seatingPreference, setSeatingPreference] = reactExports.useState(lockedSeatingPreference ?? "ANY");
  const [selectedTableId, setSelectedTableId] = reactExports.useState(preferredTableId ?? null);
  const [currentEntry, setCurrentEntry] = reactExports.useState(null);
  const currentEntryRef = reactExports.useRef(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [submitError, setSubmitError] = reactExports.useState(null);
  const [cancelling, setCancelling] = reactExports.useState(false);
  const [notificationMessage, setNotificationMessage] = reactExports.useState(null);
  const loadWaitingRows = async () => {
    const {
      data,
      error
    } = await supabase.from("waiting_entries").select("id, phone, people, seating_preference, preferred_table_id, status, created_at").eq("restaurant_id", storeId).eq("status", "WAITING").order("created_at");
    if (!isWaitingPreferenceSchemaError(error)) {
      return (data ?? []).map((entry) => {
        const preference = normalizeWaitingPreference(entry);
        return {
          ...entry,
          phone: preference.phone,
          seating_preference: preference.seating_preference,
          preferred_table_id: preference.preferred_table_id,
          customer_name: preference.customer_name
        };
      });
    }
    const {
      data: fallbackData
    } = await supabase.from("waiting_entries").select("id, phone, people, status, created_at").eq("restaurant_id", storeId).eq("status", "WAITING").order("created_at");
    return (fallbackData ?? []).map((entry) => {
      const preference = normalizeWaitingPreference(entry);
      return {
        ...entry,
        phone: preference.phone,
        seating_preference: preference.seating_preference,
        preferred_table_id: preference.preferred_table_id,
        customer_name: preference.customer_name
      };
    });
  };
  reactExports.useEffect(() => {
    let active = true;
    const loadWaitingCount = async () => {
      const waitingRows = await loadWaitingRows();
      if (!active) return;
      const currentId = currentEntryRef.current?.id;
      setWaitingCount(waitingRows.length);
      if (currentId) {
        const currentIndex = waitingRows.findIndex((row) => row.id === currentId);
        setOrder(currentIndex >= 0 ? currentIndex + 1 : 1);
        const current = waitingRows[currentIndex];
        if (current?.seating_preference === "SPECIFIC" && current.preferred_table_id) {
          const tableIndex = waitingRows.filter((row) => row.preferred_table_id === current.preferred_table_id).findIndex((row) => row.id === currentId);
          setTableOrder(tableIndex >= 0 ? tableIndex + 1 : null);
        } else {
          setTableOrder(null);
        }
        return;
      }
      setOrder(waitingRows.length + 1);
    };
    (async () => {
      const [{
        data: restaurantData
      }, {
        data: tableData
      }] = await Promise.all([supabase.from("restaurants").select("name").eq("id", storeId).maybeSingle(), supabase.from("restaurant_tables").select("id, table_number, seats, status, table_label, seat_label").eq("restaurant_id", storeId).order("table_number")]);
      if (!active) return;
      if (restaurantData) setRestaurant(restaurantData);
      const nextTables = tableData ?? [];
      setTables(nextTables);
      setSelectedTableId((prev) => prev ?? preferredTableId ?? nextTables[0]?.id ?? null);
      if (entryId) {
        const {
          data: entryData,
          error: entryError
        } = await supabase.from("waiting_entries").select("id, phone, people, seating_preference, preferred_table_id, status, created_at").eq("id", entryId).eq("restaurant_id", storeId).maybeSingle();
        if (!active) return;
        if (entryData || isWaitingPreferenceSchemaError(entryError)) {
          const fallbackEntry = entryData ? null : await supabase.from("waiting_entries").select("id, phone, people, status, created_at").eq("id", entryId).eq("restaurant_id", storeId).maybeSingle();
          if (!active) return;
          const rawEntry = entryData ?? fallbackEntry?.data;
          if (!rawEntry) return;
          const preference = normalizeWaitingPreference(rawEntry);
          const entry = {
            ...rawEntry,
            phone: preference.phone,
            seating_preference: preference.seating_preference,
            preferred_table_id: preference.preferred_table_id,
            customer_name: preference.customer_name
          };
          currentEntryRef.current = entry;
          setCurrentEntry(entry);
          rememberWaitingEntry(entry.id);
          setPhone(entry.phone);
          setSeatingPreference(entry.seating_preference === "SPECIFIC" ? "SPECIFIC" : "ANY");
          setSelectedTableId(entry.preferred_table_id ?? nextTables[0]?.id ?? null);
          setPhase("waiting");
        }
      }
      await loadWaitingCount();
    })();
    const channel = supabase.channel(`waiting:${storeId}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "waiting_entries",
      filter: `restaurant_id=eq.${storeId}`
    }, async () => {
      await loadWaitingCount();
    }).subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [entryId, preferredTableId, storeId]);
  reactExports.useEffect(() => {
    if (entryId || phone || session.role === "guest") return;
    setPhone(session.phone);
  }, [entryId, phone, session.phone, session.role]);
  reactExports.useEffect(() => {
    if (!currentEntry?.id || currentEntry.status === "CANCELLED") return;
    const channel = supabase.channel(getWaitingNotificationChannelName(currentEntry.id)).on("broadcast", {
      event: WAITING_NOTIFICATION_EVENT
    }, ({
      payload
    }) => {
      const nextNotification = payload;
      if (nextNotification.entryId !== currentEntry.id) return;
      setNotificationMessage(nextNotification.message);
      if (session.notifications && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(`${nextNotification.restaurantName} 입장 안내`, {
          body: nextNotification.message
        });
      }
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEntry?.id, currentEntry?.status, session.notifications]);
  const requestedPeople = people ?? 2;
  const isGroupWaiting = requestedPeople > 4;
  reactExports.useEffect(() => {
    if (isGroupWaiting && seatingPreference === "SPECIFIC") {
      setSeatingPreference("ANY");
    }
  }, [isGroupWaiting, seatingPreference]);
  const registerWaiting = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const waitingRows = await loadWaitingRows();
    const nextOrder = waitingRows.length + 1;
    const preferredTableId2 = !isGroupWaiting && seatingPreference === "SPECIFIC" ? selectedTableId : null;
    if (preferredTableId2) {
      const {
        data: tableStatus,
        error: tableStatusError
      } = await supabase.from("restaurant_tables").select("status").eq("id", preferredTableId2).eq("restaurant_id", storeId).maybeSingle();
      if (tableStatusError) {
        setSubmitting(false);
        setSubmitError(tableStatusError.message);
        return;
      }
      if (tableStatus?.status !== "EMPTY") {
        setSubmitting(false);
        setSubmitError("선택한 테이블이 방금 사용 중으로 변경됐어요. 다른 자리를 선택해주세요.");
        return;
      }
    }
    const nextTableOrder = preferredTableId2 === null ? null : waitingRows.filter((entry2) => entry2.preferred_table_id === preferredTableId2).length + 1;
    const customerName = session.role !== "guest" && session.phone && session.phone === phone ? session.name : void 0;
    const {
      data,
      error
    } = await supabase.from("waiting_entries").insert({
      restaurant_id: storeId,
      phone,
      people: people ?? 2,
      seating_preference: seatingPreference,
      preferred_table_id: preferredTableId2,
      status: "WAITING"
    }).select("id, phone, people, seating_preference, preferred_table_id, status, created_at").single();
    setSubmitting(false);
    if (error) {
      if (!isWaitingPreferenceSchemaError(error)) {
        setSubmitError(error.message);
        return;
      }
      setSubmitting(true);
      const fallback = await supabase.from("waiting_entries").insert({
        restaurant_id: storeId,
        phone: encodeFallbackWaitingPhone(phone, seatingPreference, preferredTableId2, customerName),
        people: people ?? 2,
        status: "WAITING"
      }).select("id, phone, people, status, created_at").single();
      setSubmitting(false);
      if (fallback.error) {
        setSubmitError(fallback.error.message);
        return;
      }
      const preference2 = normalizeWaitingPreference(fallback.data);
      const entry2 = {
        ...fallback.data,
        phone: preference2.phone,
        seating_preference: preference2.seating_preference,
        preferred_table_id: preference2.preferred_table_id,
        customer_name: preference2.customer_name
      };
      currentEntryRef.current = entry2;
      setCurrentEntry(entry2);
      rememberWaitingEntry(entry2.id);
      setOrder(nextOrder);
      setTableOrder(nextTableOrder);
      setPhase("waiting");
      return;
    }
    const preference = normalizeWaitingPreference(data);
    const entry = {
      ...data,
      phone: preference.phone,
      seating_preference: preference.seating_preference,
      preferred_table_id: preference.preferred_table_id,
      customer_name: preference.customer_name
    };
    currentEntryRef.current = entry;
    setCurrentEntry(entry);
    rememberWaitingEntry(entry.id);
    setOrder(nextOrder);
    setTableOrder(nextTableOrder);
    setPhase("waiting");
  };
  const cancelWaiting = async () => {
    if (!currentEntry) {
      navigate({
        to: "/waiting"
      });
      return;
    }
    setCancelling(true);
    const {
      error
    } = await supabase.from("waiting_entries").update({
      status: "CANCELLED",
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", currentEntry.id);
    setCancelling(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    const cancelledEntry = {
      ...currentEntry,
      status: "CANCELLED"
    };
    currentEntryRef.current = cancelledEntry;
    setCurrentEntry(cancelledEntry);
    forgetWaitingEntry(currentEntry.id);
  };
  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const availableTables = tables.filter((table) => table.status === "EMPTY");
  const entryPeople = currentEntry?.people ?? people ?? 2;
  const entryName = currentEntry?.customer_name;
  const entryPreference = currentEntry?.seating_preference === "SPECIFIC" ? "원하는 자리 웨이팅" : "상관없음";
  const entryTable = currentEntry?.preferred_table_id ? tables.find((table) => table.id === currentEntry.preferred_table_id) : null;
  const isCancelled = currentEntry?.status === "CANCELLED";
  const isChoiceLocked = Boolean(lockedSeatingPreference);
  if (phase === "register") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-20 flex items-center gap-3 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate({
          to: "/store/$storeId",
          params: {
            storeId
          }
        }), className: "-ml-2 flex h-9 w-9 items-center justify-center rounded-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "flex-1 text-[15px] font-semibold", children: "웨이팅 등록" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-5 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: restaurant?.name ?? "매장" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-baseline gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-bold", children: [
              requestedPeople,
              "명"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: "원격 웨이팅" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 border-t border-border pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground", children: "현재 대기" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-base font-bold", children: [
              waitingCount,
              "팀"
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground", children: "전화번호" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: phone, onChange: (e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11)), placeholder: "010 0000 0000", inputMode: "numeric", className: "mt-2 h-14 w-full rounded-2xl bg-surface px-4 text-base tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-3 w-3" }),
            "사장님이 입장 안내를 보내면 이 화면에 바로 표시돼요"
          ] }),
          session.role !== "guest" && session.phone === phone && session.name && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[11px] text-primary", children: [
            session.name,
            "님 이름으로 웨이팅을 등록합니다."
          ] }),
          submitError && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-[11px] text-destructive", children: [
            "등록 실패: ",
            submitError
          ] })
        ] }),
        isChoiceLocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-3xl bg-surface p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "선택한 웨이팅 방식" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm font-semibold", children: seatingPreference === "SPECIFIC" ? "원하는 자리 웨이팅" : "상관없음 웨이팅" }),
          seatingPreference === "SPECIFIC" && selectedTable && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
            getTableLabel(selectedTable),
            " · ",
            getSeatLabel(selectedTable)
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "웨이팅 조건" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setSeatingPreference("ANY"), className: `rounded-2xl px-4 py-3 text-left transition-colors ${seatingPreference === "ANY" ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold", children: "상관없음" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-[11px] opacity-80", children: "빠른 자리 우선" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: isGroupWaiting || availableTables.length === 0, onClick: () => {
              setSeatingPreference("SPECIFIC");
              setSelectedTableId((prev) => prev ?? availableTables[0]?.id ?? null);
            }, className: `rounded-2xl px-4 py-3 text-left transition-colors ${seatingPreference === "SPECIFIC" ? "bg-primary text-primary-foreground" : isGroupWaiting || availableTables.length === 0 ? "bg-surface text-muted-foreground opacity-45" : "bg-surface text-muted-foreground"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold", children: "원하는 자리" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-[11px] opacity-80", children: "이용 가능 테이블" })
            ] })
          ] }),
          isGroupWaiting && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground", children: "원하는 자리 웨이팅은 4인 이하만 가능합니다. 단체는 사장님이 테이블을 묶어서 배정해드려요." }),
          !isGroupWaiting && availableTables.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground", children: "현재 이용 가능한 테이블이 없어 원하는 자리 웨이팅은 선택할 수 없어요." })
        ] }),
        seatingPreference === "SPECIFIC" && !isChoiceLocked && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "원하는 테이블" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-2 gap-2", children: availableTables.map((table) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setSelectedTableId(table.id), className: `rounded-2xl border px-3 py-3 text-left transition-colors ${selectedTableId === table.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-foreground"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold", children: getTableLabel(table) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-[11px] text-muted-foreground", children: getSeatLabel(table) })
          ] }, table.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-auto px-5 pt-8 pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: phone.length < 10 || submitting || seatingPreference === "SPECIFIC" && !selectedTableId, onClick: registerWaiting, className: "flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition disabled:opacity-40", children: submitting ? "등록 중..." : "웨이팅 등록하기" }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-20 flex items-center gap-3 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "flex-1 text-[15px] font-semibold", children: "내 웨이팅" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "px-5 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[11px] font-medium text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-1.5 w-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" })
          ] }),
          "대기중"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: restaurant?.name ?? "매장" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-baseline gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[64px] font-bold leading-none tabular-nums", children: isCancelled ? "-" : order }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base text-muted-foreground", children: isCancelled ? "취소됨" : "번째" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-sm text-muted-foreground", children: [
          entryPeople,
          "명 · ",
          currentEntry?.phone ?? phone
        ] }),
        entryName && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-primary", children: [
          entryName,
          "님"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          entryPreference,
          entryTable ? ` · ${getTableLabel(entryTable)} (${getSeatLabel(entryTable)})` : "",
          !entryTable && selectedTable && seatingPreference === "SPECIFIC" ? ` · ${getTableLabel(selectedTable)} (${getSeatLabel(selectedTable)})` : ""
        ] }),
        tableOrder && !isCancelled && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary", children: [
          "이 테이블 ",
          tableOrder,
          "번째 예약"
        ] })
      ] }),
      notificationMessage && !isCancelled && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-3xl border border-primary/30 bg-primary/10 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4" }),
          "입장 안내가 도착했어요"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: notificationMessage })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-5 space-y-3", children: [{
        label: "웨이팅 등록 완료",
        done: true
      }, {
        label: isCancelled ? "웨이팅 취소 완료" : `내 앞으로 ${Math.max(0, order - 1)}팀 대기중`,
        done: isCancelled,
        active: !isCancelled
      }, {
        label: "입장 가능 알림 발송",
        done: Boolean(notificationMessage),
        active: Boolean(notificationMessage)
      }, {
        label: "5분 내 매장 도착 (노쇼 방지)",
        done: false
      }].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-status-empty text-primary-foreground" : s.active ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"}`, children: s.done ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: i + 1 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm ${s.active ? "font-semibold text-foreground" : "text-muted-foreground"}`, children: s.label })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-auto px-5 pb-2 pt-8", children: [
      submitError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 text-center text-[11px] text-destructive", children: submitError }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: isCancelled || cancelling, onClick: cancelWaiting, className: "flex h-12 w-full items-center justify-center rounded-2xl border border-border text-sm font-medium text-muted-foreground transition disabled:opacity-40", children: cancelling ? "취소 중..." : isCancelled ? "취소된 웨이팅" : "웨이팅 취소하기" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/waiting", className: "mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-surface text-sm font-medium text-muted-foreground", children: "내 웨이팅 목록 보기" })
    ] })
  ] });
}
export {
  WaitingPage as component
};
