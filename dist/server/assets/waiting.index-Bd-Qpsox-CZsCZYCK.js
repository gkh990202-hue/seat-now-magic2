import { S as reactExports, J as jsxRuntimeExports } from "./server-DbFEfZ8R-BI0li19e.js";
import { L as Link } from "./router-Dq4Yi7A5-BEoTr15r.js";
import { A as AppShell, C as Clock } from "./AppShell-DIzGv6BN-CHbiqRc7.js";
import { s as supabase } from "./client-BooYdwAs-Jckt6Bjm.js";
import { f as getTableLabel, g as getSeatLabel } from "./table-layout-DP4mTr6k-DP4mTr6k.js";
import { i as isWaitingPreferenceSchemaError, n as normalizeWaitingPreference } from "./waiting-preferences-DPgt-__X-DPgt-__X.js";
import { g as getStoredWaitingEntryIds } from "./my-waiting-entries-mW30yyoy-mW30yyoy.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
function WaitingListPage() {
  const [entries, setEntries] = reactExports.useState([]);
  const [restaurants, setRestaurants] = reactExports.useState([]);
  const [tables, setTables] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let active = true;
    const loadWaiting = async () => {
      setLoading(true);
      const storedEntryIds = getStoredWaitingEntryIds();
      if (storedEntryIds.length === 0) {
        if (!active) return;
        setEntries([]);
        setRestaurants([]);
        setTables([]);
        setLoading(false);
        return;
      }
      const [{
        data: entryData,
        error: entryError
      }, {
        data: queueData
      }, {
        data: restaurantData
      }, {
        data: tableData
      }] = await Promise.all([supabase.from("waiting_entries").select("id, restaurant_id, phone, people, seating_preference, preferred_table_id, created_at").in("id", storedEntryIds).eq("status", "WAITING").order("created_at"), supabase.from("waiting_entries").select("id, restaurant_id").eq("status", "WAITING").order("created_at"), supabase.from("restaurants").select("id, name"), supabase.from("restaurant_tables").select("id, table_number, seats, table_label, seat_label")]);
      if (!active) return;
      let waitingData = entryData;
      if (isWaitingPreferenceSchemaError(entryError)) {
        const {
          data: fallbackData
        } = await supabase.from("waiting_entries").select("id, restaurant_id, phone, people, created_at").in("id", storedEntryIds).eq("status", "WAITING").order("created_at");
        if (!active) return;
        waitingData = fallbackData;
      }
      const orderByEntryId = getQueueOrderByEntryId(queueData ?? []);
      setEntries((waitingData ?? []).map((entry) => {
        const preference = normalizeWaitingPreference(entry);
        return {
          ...entry,
          phone: preference.phone,
          seating_preference: preference.seating_preference,
          preferred_table_id: preference.preferred_table_id,
          customer_name: preference.customer_name,
          order: orderByEntryId.get(entry.id) ?? 1
        };
      }));
      setRestaurants(restaurantData ?? []);
      setTables(tableData ?? []);
      setLoading(false);
    };
    loadWaiting();
    window.addEventListener("seatnow-my-waiting-entries", loadWaiting);
    window.addEventListener("storage", loadWaiting);
    const channel = supabase.channel("waiting-list").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "waiting_entries"
    }, loadWaiting).subscribe();
    return () => {
      active = false;
      window.removeEventListener("seatnow-my-waiting-entries", loadWaiting);
      window.removeEventListener("storage", loadWaiting);
      supabase.removeChannel(channel);
    };
  }, []);
  const restaurantById = reactExports.useMemo(() => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])), [restaurants]);
  const tableById = reactExports.useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "px-5 pt-12 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[22px] font-bold tracking-tight", children: "내 웨이팅" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "실시간 순번이 자동으로 갱신돼요" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mt-2 px-5", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "mx-auto h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "웨이팅을 불러오는 중이에요" })
    ] }) : entries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl bg-surface p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "mx-auto h-8 w-8 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "진행중인 웨이팅이 없어요" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: entries.map((entry) => {
      const restaurant = restaurantById.get(entry.restaurant_id);
      const table = entry.preferred_table_id ? tableById.get(entry.preferred_table_id) : null;
      const preference = entry.seating_preference === "SPECIFIC" ? "원하는 자리 웨이팅" : "상관없음";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/waiting/$storeId", params: {
        storeId: entry.restaurant_id
      }, search: {
        people: entry.people,
        entryId: entry.id
      }, className: "block rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[11px] font-medium text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-1.5 w-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" })
          ] }),
          "대기중"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-medium", children: restaurant?.name ?? "매장" }),
        entry.customer_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-primary", children: [
          entry.customer_name,
          "님"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-baseline gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-4xl font-bold tabular-nums", children: entry.order }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
            "번째 · ",
            entry.people,
            "명"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
          preference,
          table ? ` · ${getTableLabel(table)} (${getSeatLabel(table)})` : ""
        ] })
      ] }, entry.id);
    }) }) })
  ] });
}
function getQueueOrderByEntryId(rows) {
  const countsByRestaurantId = /* @__PURE__ */ new Map();
  const orderByEntryId = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const nextOrder = (countsByRestaurantId.get(row.restaurant_id) ?? 0) + 1;
    countsByRestaurantId.set(row.restaurant_id, nextOrder);
    orderByEntryId.set(row.id, nextOrder);
  }
  return orderByEntryId;
}
export {
  WaitingListPage as component
};
