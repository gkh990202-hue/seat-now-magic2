import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TableStatus } from "@/lib/mock-data";

export interface DbTable {
  id: string;
  restaurant_id: string;
  table_number: number;
  seats: number;
  seat_label: string | null;
  table_label: string | null;
  status: TableStatus;
  occupied_at: string | null;
  updated_at: string;
  layout_x: number | null;
  layout_y: number | null;
  layout_w: number | null;
  layout_h: number | null;
}

export function useRealtimeTables(restaurantId: string | undefined) {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) {
      setTables([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("table_number");
      if (!active) return;
      if (error) {
        console.error("[useRealtimeTables]", error.message);
        setTables([]);
      } else if (data) {
        setTables(data as DbTable[]);
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel(`tables:${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "restaurant_tables",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          setTables((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as DbTable].sort(
                (a, b) => a.table_number - b.table_number,
              );
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((t) =>
                t.id === (payload.new as DbTable).id ? (payload.new as DbTable) : t,
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== (payload.old as DbTable).id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return { tables, loading };
}

export interface DbRestaurant {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

const LOAD_TIMEOUT_MS = 5_000;

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<DbRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setError((prev) => prev ?? "요청 시간이 초과되었습니다 (5초)");
    }, LOAD_TIMEOUT_MS);

    (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from("restaurants")
          .select("id, name, address, created_at")
          .order("created_at");
        if (!active) return;
        window.clearTimeout(timer);
        if (queryError) {
          console.error("[useRestaurants]", queryError.message);
          setError(queryError.message);
          setRestaurants([]);
        } else {
          setRestaurants((data ?? []) as DbRestaurant[]);
        }
        setLoading(false);
      } catch (e) {
        if (!active) return;
        window.clearTimeout(timer);
        const message = e instanceof Error ? e.message : "알 수 없는 오류";
        console.error("[useRestaurants]", message);
        setError(message);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  return { restaurants, loading, error };
}

export function useFirstRestaurant() {
  const [restaurant, setRestaurant] = useState<Pick<DbRestaurant, "id" | "name"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      setLoading(false);
      setError((prev) => prev ?? "요청 시간이 초과되었습니다 (5초)");
    }, LOAD_TIMEOUT_MS);

    (async () => {
      try {
        const { data, error: queryError } = await supabase
          .from("restaurants")
          .select("id, name")
          .order("created_at")
          .limit(1)
          .maybeSingle();
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
