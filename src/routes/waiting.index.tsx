import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getSeatLabel, getTableLabel } from "@/lib/table-layout";
import { isWaitingPreferenceSchemaError, normalizeWaitingPreference } from "@/lib/waiting-preferences";
import { getStoredWaitingEntryIds } from "@/lib/my-waiting-entries";

export const Route = createFileRoute("/waiting/")({
  component: WaitingListPage,
});

interface WaitingEntry {
  id: string;
  restaurant_id: string;
  phone: string;
  people: number;
  seating_preference: string;
  preferred_table_id: string | null;
  customer_name: string | null;
  created_at: string;
  order: number;
}

interface RestaurantRow {
  id: string;
  name: string;
}

interface TableRow {
  id: string;
  table_number: number;
  seats: number;
  table_label: string | null;
  seat_label: string | null;
}

interface QueueRow {
  id: string;
  restaurant_id: string;
}

function WaitingListPage() {
  const [entries, setEntries] = useState<WaitingEntry[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const [
        { data: entryData, error: entryError },
        { data: queueData },
        { data: restaurantData },
        { data: tableData },
      ] = await Promise.all([
        supabase
          .from("waiting_entries")
          .select(
            "id, restaurant_id, phone, people, seating_preference, preferred_table_id, created_at",
          )
          .in("id", storedEntryIds)
          .eq("status", "WAITING")
          .order("created_at"),
        supabase
          .from("waiting_entries")
          .select("id, restaurant_id")
          .eq("status", "WAITING")
          .order("created_at"),
        supabase.from("restaurants").select("id, name"),
        supabase
          .from("restaurant_tables")
          .select("id, table_number, seats, table_label, seat_label"),
      ]);
      if (!active) return;
      let waitingData = entryData;
      if (isWaitingPreferenceSchemaError(entryError)) {
        const { data: fallbackData } = await supabase
          .from("waiting_entries")
          .select("id, restaurant_id, phone, people, created_at")
          .in("id", storedEntryIds)
          .eq("status", "WAITING")
          .order("created_at");
        if (!active) return;
        waitingData = fallbackData as typeof entryData;
      }
      const orderByEntryId = getQueueOrderByEntryId((queueData ?? []) as QueueRow[]);
      setEntries(
        (waitingData ?? []).map((entry) => {
          const preference = normalizeWaitingPreference(entry);
          return {
            ...entry,
            phone: preference.phone,
            seating_preference: preference.seating_preference,
            preferred_table_id: preference.preferred_table_id,
            customer_name: preference.customer_name,
            order: orderByEntryId.get(entry.id) ?? 1,
          };
        }) as WaitingEntry[],
      );
      setRestaurants((restaurantData ?? []) as RestaurantRow[]);
      setTables((tableData ?? []) as TableRow[]);
      setLoading(false);
    };

    loadWaiting();
    window.addEventListener("seatnow-my-waiting-entries", loadWaiting);
    window.addEventListener("storage", loadWaiting);
    const channel = supabase
      .channel("waiting-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "waiting_entries" }, loadWaiting)
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("seatnow-my-waiting-entries", loadWaiting);
      window.removeEventListener("storage", loadWaiting);
      supabase.removeChannel(channel);
    };
  }, []);

  const restaurantById = useMemo(
    () => new Map(restaurants.map((restaurant) => [restaurant.id, restaurant])),
    [restaurants],
  );
  const tableById = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-2">
        <h1 className="text-[22px] font-bold tracking-tight">내 웨이팅</h1>
        <p className="mt-1 text-xs text-muted-foreground">실시간 순번이 자동으로 갱신돼요</p>
      </header>

      <section className="mt-2 px-5">
        {loading ? (
          <div className="rounded-3xl bg-surface p-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">웨이팅을 불러오는 중이에요</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-3xl bg-surface p-10 text-center">
            <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">진행중인 웨이팅이 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const restaurant = restaurantById.get(entry.restaurant_id);
              const table = entry.preferred_table_id
                ? tableById.get(entry.preferred_table_id)
                : null;
              const preference =
                entry.seating_preference === "SPECIFIC" ? "원하는 자리 웨이팅" : "상관없음";
              return (
                <Link
                  key={entry.id}
                  to="/waiting/$storeId"
                  params={{ storeId: entry.restaurant_id }}
                  search={{ people: entry.people, entryId: entry.id }}
                  className="block rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-surface to-surface p-5"
                >
                  <div className="flex items-center gap-2 text-[11px] font-medium text-primary">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    대기중
                  </div>
                  <p className="mt-2 text-sm font-medium">{restaurant?.name ?? "매장"}</p>
                  {entry.customer_name && (
                    <p className="mt-1 text-xs text-primary">{entry.customer_name}님</p>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tabular-nums">{entry.order}</span>
                    <span className="text-sm text-muted-foreground">번째 · {entry.people}명</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {preference}
                    {table ? ` · ${getTableLabel(table)} (${getSeatLabel(table)})` : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function getQueueOrderByEntryId(rows: QueueRow[]) {
  const countsByRestaurantId = new Map<string, number>();
  const orderByEntryId = new Map<string, number>();
  for (const row of rows) {
    const nextOrder = (countsByRestaurantId.get(row.restaurant_id) ?? 0) + 1;
    countsByRestaurantId.set(row.restaurant_id, nextOrder);
    orderByEntryId.set(row.id, nextOrder);
  }
  return orderByEntryId;
}
