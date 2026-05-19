import { S as reactExports, J as jsxRuntimeExports } from "./server-DbFEfZ8R-BI0li19e.js";
import { s as supabase } from "./client-BooYdwAs-Jckt6Bjm.js";
const colorMap = {
  EMPTY: "text-status-empty",
  OCCUPIED: "text-status-occupied",
  CLEANING: "text-status-cleaning",
  RESERVED: "text-status-reserved"
};
function StatusDot({ status, pulse = false }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `relative inline-flex h-2 w-2 ${colorMap[status]}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute inset-0 rounded-full bg-current ${pulse ? "pulse-dot" : ""}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-block h-2 w-2 rounded-full bg-current" })
  ] });
}
const statusLabel = {
  EMPTY: "비어있음",
  OCCUPIED: "사용중",
  CLEANING: "청소중",
  RESERVED: "예약"
};
function useRealtimeTables(restaurantId) {
  const [tables, setTables] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (!restaurantId) {
      setTables([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase.from("restaurant_tables").select("*").eq("restaurant_id", restaurantId).order("table_number");
      if (!active) return;
      if (error) {
        console.error("[useRealtimeTables]", error.message);
        setTables([]);
      } else if (data) {
        setTables(data);
      }
      setLoading(false);
    })();
    const channel = supabase.channel(`tables:${restaurantId}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "restaurant_tables",
        filter: `restaurant_id=eq.${restaurantId}`
      },
      (payload) => {
        setTables((prev) => {
          if (payload.eventType === "INSERT") {
            return [...prev, payload.new].sort(
              (a, b) => a.table_number - b.table_number
            );
          }
          if (payload.eventType === "UPDATE") {
            return prev.map(
              (t) => t.id === payload.new.id ? payload.new : t
            );
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((t) => t.id !== payload.old.id);
          }
          return prev;
        });
      }
    ).subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);
  return { tables, loading };
}
const LOAD_TIMEOUT_MS = 5e3;
function useFirstRestaurant() {
  const [restaurant, setRestaurant] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setError((prev) => prev ?? "요청 시간이 초과되었습니다 (5초)");
    }, LOAD_TIMEOUT_MS);
    (async () => {
      try {
        const { data, error: queryError } = await supabase.from("restaurants").select("id, name").order("created_at").limit(1).maybeSingle();
        if (!active) return;
        window.clearTimeout(timer);
        if (queryError) {
          console.error("[useFirstRestaurant]", queryError.message);
          setError(queryError.message);
          setRestaurant(null);
        } else {
          setRestaurant(data);
        }
        setLoading(false);
      } catch (e) {
        if (!active) return;
        window.clearTimeout(timer);
        const message = e instanceof Error ? e.message : "알 수 없는 오류";
        console.error("[useFirstRestaurant]", message);
        setError(message);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);
  return { restaurant, loading, error };
}
export {
  StatusDot as S,
  useRealtimeTables as a,
  statusLabel as s,
  useFirstRestaurant as u
};
