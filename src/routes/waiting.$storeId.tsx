import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, Check, ChevronLeft, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { getSeatLabel, getTableLabel } from "@/lib/table-layout";
import {
  encodeFallbackWaitingPhone,
  isWaitingPreferenceSchemaError,
  normalizeWaitingPreference,
  type SeatingPreference,
} from "@/lib/waiting-preferences";
import { useAppSession } from "@/lib/auth-session";
import { forgetWaitingEntry, rememberWaitingEntry } from "@/lib/my-waiting-entries";
import {
  getWaitingNotificationChannelName,
  WAITING_NOTIFICATION_EVENT,
  type WaitingNotificationPayload,
} from "@/lib/waiting-notifications";

interface Search {
  people?: number;
  entryId?: string;
  mode?: SeatingPreference;
  preferredTableId?: string;
}

export const Route = createFileRoute("/waiting/$storeId")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    people: typeof s.people === "number" ? s.people : Number(s.people) || 2,
    entryId: typeof s.entryId === "string" ? s.entryId : undefined,
    mode: s.mode === "ANY" || s.mode === "SPECIFIC" ? s.mode : undefined,
    preferredTableId: typeof s.preferredTableId === "string" ? s.preferredTableId : undefined,
  }),
  component: WaitingPage,
});

interface WaitingEntry {
  id: string;
  phone: string;
  people: number;
  seating_preference: string;
  preferred_table_id: string | null;
  customer_name: string | null;
  status: string;
  created_at: string;
}

interface WaitingTable {
  id: string;
  table_number: number;
  seats: number;
  status: string;
  table_label: string | null;
  seat_label: string | null;
}

function WaitingPage() {
  const { storeId } = Route.useParams();
  const { people, entryId, mode, preferredTableId } = Route.useSearch();
  const navigate = useNavigate();
  const session = useAppSession();
  const lockedSeatingPreference =
    mode === "SPECIFIC" || preferredTableId ? "SPECIFIC" : mode === "ANY" ? "ANY" : null;

  const [phase, setPhase] = useState<"register" | "waiting">(entryId ? "waiting" : "register");
  const [phone, setPhone] = useState("");
  const [restaurant, setRestaurant] = useState<{ name: string } | null>(null);
  const [tables, setTables] = useState<WaitingTable[]>([]);
  const [waitingCount, setWaitingCount] = useState(0);
  const [order, setOrder] = useState<number>(1);
  const [tableOrder, setTableOrder] = useState<number | null>(null);
  const [seatingPreference, setSeatingPreference] = useState<SeatingPreference>(
    lockedSeatingPreference ?? "ANY",
  );
  const [selectedTableId, setSelectedTableId] = useState<string | null>(preferredTableId ?? null);
  const [currentEntry, setCurrentEntry] = useState<WaitingEntry | null>(null);
  const currentEntryRef = useRef<WaitingEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const loadWaitingRows = async () => {
    const { data, error } = await supabase
      .from("waiting_entries")
      .select("id, phone, people, seating_preference, preferred_table_id, status, created_at")
      .eq("restaurant_id", storeId)
      .eq("status", "WAITING")
      .order("created_at");
    if (!isWaitingPreferenceSchemaError(error)) {
      return (data ?? []).map((entry) => {
        const preference = normalizeWaitingPreference(entry);
        return {
          ...entry,
          phone: preference.phone,
          seating_preference: preference.seating_preference,
          preferred_table_id: preference.preferred_table_id,
          customer_name: preference.customer_name,
        } as WaitingEntry;
      });
    }

    const { data: fallbackData } = await supabase
      .from("waiting_entries")
      .select("id, phone, people, status, created_at")
      .eq("restaurant_id", storeId)
      .eq("status", "WAITING")
      .order("created_at");
    return (fallbackData ?? []).map((entry) => {
      const preference = normalizeWaitingPreference(entry);
      return {
        ...entry,
        phone: preference.phone,
        seating_preference: preference.seating_preference,
        preferred_table_id: preference.preferred_table_id,
        customer_name: preference.customer_name,
      } as WaitingEntry;
    });
  };

  useEffect(() => {
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
          const tableIndex = waitingRows
            .filter((row) => row.preferred_table_id === current.preferred_table_id)
            .findIndex((row) => row.id === currentId);
          setTableOrder(tableIndex >= 0 ? tableIndex + 1 : null);
        } else {
          setTableOrder(null);
        }
        return;
      }
      setOrder(waitingRows.length + 1);
    };

    (async () => {
      const [{ data: restaurantData }, { data: tableData }] = await Promise.all([
        supabase.from("restaurants").select("name").eq("id", storeId).maybeSingle(),
        supabase
          .from("restaurant_tables")
          .select("id, table_number, seats, status, table_label, seat_label")
          .eq("restaurant_id", storeId)
          .order("table_number"),
      ]);
      if (!active) return;
      if (restaurantData) setRestaurant(restaurantData);
      const nextTables = (tableData ?? []) as WaitingTable[];
      setTables(nextTables);
      setSelectedTableId((prev) => prev ?? preferredTableId ?? nextTables[0]?.id ?? null);

      if (entryId) {
        const { data: entryData, error: entryError } = await supabase
          .from("waiting_entries")
          .select(
            "id, phone, people, seating_preference, preferred_table_id, status, created_at",
          )
          .eq("id", entryId)
          .eq("restaurant_id", storeId)
          .maybeSingle();
        if (!active) return;
        if (entryData || isWaitingPreferenceSchemaError(entryError)) {
          const fallbackEntry = entryData
            ? null
            : await supabase
                .from("waiting_entries")
                .select("id, phone, people, status, created_at")
                .eq("id", entryId)
                .eq("restaurant_id", storeId)
                .maybeSingle();
          if (!active) return;
          const rawEntry = entryData ?? fallbackEntry?.data;
          if (!rawEntry) return;
          const preference = normalizeWaitingPreference(rawEntry);
          const entry = {
            ...rawEntry,
            phone: preference.phone,
            seating_preference: preference.seating_preference,
            preferred_table_id: preference.preferred_table_id,
            customer_name: preference.customer_name,
          } as WaitingEntry;
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

    const channel = supabase
      .channel(`waiting:${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiting_entries",
          filter: `restaurant_id=eq.${storeId}`,
        },
        async () => {
          await loadWaitingCount();
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [entryId, preferredTableId, storeId]);

  useEffect(() => {
    if (entryId || phone || session.role === "guest") return;
    setPhone(session.phone);
  }, [entryId, phone, session.phone, session.role]);

  useEffect(() => {
    if (!currentEntry?.id || currentEntry.status === "CANCELLED") return;

    const channel = supabase
      .channel(getWaitingNotificationChannelName(currentEntry.id))
      .on("broadcast", { event: WAITING_NOTIFICATION_EVENT }, ({ payload }) => {
        const nextNotification = payload as WaitingNotificationPayload;
        if (nextNotification.entryId !== currentEntry.id) return;
        setNotificationMessage(nextNotification.message);
        if (
          session.notifications &&
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(`${nextNotification.restaurantName} 입장 안내`, {
            body: nextNotification.message,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEntry?.id, currentEntry?.status, session.notifications]);

  const requestedPeople = people ?? 2;
  const isGroupWaiting = requestedPeople > 4;

  useEffect(() => {
    if (isGroupWaiting && seatingPreference === "SPECIFIC") {
      setSeatingPreference("ANY");
    }
  }, [isGroupWaiting, seatingPreference]);

  const registerWaiting = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const waitingRows = await loadWaitingRows();
    const nextOrder = waitingRows.length + 1;
    const preferredTableId = !isGroupWaiting && seatingPreference === "SPECIFIC" ? selectedTableId : null;
    if (preferredTableId) {
      const { data: tableStatus, error: tableStatusError } = await supabase
        .from("restaurant_tables")
        .select("status")
        .eq("id", preferredTableId)
        .eq("restaurant_id", storeId)
        .maybeSingle();
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
    const nextTableOrder =
      preferredTableId === null
        ? null
        : waitingRows.filter((entry) => entry.preferred_table_id === preferredTableId).length + 1;
    const customerName =
      session.role !== "guest" && session.phone && session.phone === phone ? session.name : undefined;
    const { data, error } = await supabase
      .from("waiting_entries")
      .insert({
        restaurant_id: storeId,
        phone,
        people: people ?? 2,
        seating_preference: seatingPreference,
        preferred_table_id: preferredTableId,
        status: "WAITING",
      })
      .select("id, phone, people, seating_preference, preferred_table_id, status, created_at")
      .single();
    setSubmitting(false);

    if (error) {
      if (!isWaitingPreferenceSchemaError(error)) {
        setSubmitError(error.message);
        return;
      }

      setSubmitting(true);
      const fallback = await supabase
        .from("waiting_entries")
        .insert({
          restaurant_id: storeId,
          phone: encodeFallbackWaitingPhone(phone, seatingPreference, preferredTableId, customerName),
          people: people ?? 2,
          status: "WAITING",
        })
        .select("id, phone, people, status, created_at")
        .single();
      setSubmitting(false);
      if (fallback.error) {
        setSubmitError(fallback.error.message);
        return;
      }
      const preference = normalizeWaitingPreference(fallback.data);
      const entry = {
        ...fallback.data,
        phone: preference.phone,
        seating_preference: preference.seating_preference,
        preferred_table_id: preference.preferred_table_id,
        customer_name: preference.customer_name,
      } as WaitingEntry;
      currentEntryRef.current = entry;
      setCurrentEntry(entry);
      rememberWaitingEntry(entry.id);
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
      customer_name: preference.customer_name,
    } as WaitingEntry;
    currentEntryRef.current = entry;
    setCurrentEntry(entry);
    rememberWaitingEntry(entry.id);
    setOrder(nextOrder);
    setTableOrder(nextTableOrder);
    setPhase("waiting");
  };

  const cancelWaiting = async () => {
    if (!currentEntry) {
      navigate({ to: "/waiting" });
      return;
    }
    setCancelling(true);
    const { error } = await supabase
      .from("waiting_entries")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", currentEntry.id);
    setCancelling(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    const cancelledEntry = { ...currentEntry, status: "CANCELLED" };
    currentEntryRef.current = cancelledEntry;
    setCurrentEntry(cancelledEntry);
    forgetWaitingEntry(currentEntry.id);
  };

  const selectedTable = tables.find((table) => table.id === selectedTableId);
  const availableTables = tables.filter((table) => table.status === "EMPTY");
  const entryPeople = currentEntry?.people ?? people ?? 2;
  const entryName = currentEntry?.customer_name;
  const entryPreference =
    currentEntry?.seating_preference === "SPECIFIC" ? "원하는 자리 웨이팅" : "상관없음";
  const entryTable = currentEntry?.preferred_table_id
    ? tables.find((table) => table.id === currentEntry.preferred_table_id)
    : null;
  const isCancelled = currentEntry?.status === "CANCELLED";
  const isChoiceLocked = Boolean(lockedSeatingPreference);

  if (phase === "register") {
    return (
      <AppShell>
        <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl">
          <button
            onClick={() => navigate({ to: "/store/$storeId", params: { storeId } })}
            className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-[15px] font-semibold">웨이팅 등록</h1>
        </header>

        <section className="px-5 pt-2">
          <div className="rounded-3xl bg-surface p-5">
            <p className="text-xs text-muted-foreground">{restaurant?.name ?? "매장"}</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{requestedPeople}명</span>
              <span className="text-sm text-muted-foreground">원격 웨이팅</span>
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground">현재 대기</p>
                <p className="text-base font-bold">{waitingCount}팀</p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="text-xs font-medium text-muted-foreground">전화번호</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 11))}
              placeholder="010 0000 0000"
              inputMode="numeric"
              className="mt-2 h-14 w-full rounded-2xl bg-surface px-4 text-base tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Bell className="h-3 w-3" />
              사장님이 입장 안내를 보내면 이 화면에 바로 표시돼요
            </p>
            {session.role !== "guest" && session.phone === phone && session.name && (
              <p className="mt-2 text-[11px] text-primary">
                {session.name}님 이름으로 웨이팅을 등록합니다.
              </p>
            )}
            {submitError && (
              <p className="mt-2 text-[11px] text-destructive">등록 실패: {submitError}</p>
            )}
          </div>

          {isChoiceLocked ? (
            <div className="mt-5 rounded-3xl bg-surface p-4">
              <p className="text-xs font-medium text-muted-foreground">선택한 웨이팅 방식</p>
              <p className="mt-1 text-sm font-semibold">
                {seatingPreference === "SPECIFIC" ? "원하는 자리 웨이팅" : "상관없음 웨이팅"}
              </p>
              {seatingPreference === "SPECIFIC" && selectedTable && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {getTableLabel(selectedTable)} · {getSeatLabel(selectedTable)}
                </p>
              )}
            </div>
          ) : (
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground">웨이팅 조건</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSeatingPreference("ANY")}
                  className={`rounded-2xl px-4 py-3 text-left transition-colors ${
                    seatingPreference === "ANY"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground"
                  }`}
                >
                  <span className="block text-sm font-semibold">상관없음</span>
                  <span className="mt-1 block text-[11px] opacity-80">빠른 자리 우선</span>
                </button>
                <button
                  disabled={isGroupWaiting || availableTables.length === 0}
                  onClick={() => {
                    setSeatingPreference("SPECIFIC");
                    setSelectedTableId((prev) => prev ?? availableTables[0]?.id ?? null);
                  }}
                  className={`rounded-2xl px-4 py-3 text-left transition-colors ${
                    seatingPreference === "SPECIFIC"
                      ? "bg-primary text-primary-foreground"
                      : isGroupWaiting || availableTables.length === 0
                        ? "bg-surface text-muted-foreground opacity-45"
                        : "bg-surface text-muted-foreground"
                  }`}
                >
                  <span className="block text-sm font-semibold">원하는 자리</span>
                  <span className="mt-1 block text-[11px] opacity-80">이용 가능 테이블</span>
                </button>
              </div>
              {isGroupWaiting && (
                <p className="mt-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground">
                  원하는 자리 웨이팅은 4인 이하만 가능합니다. 단체는 사장님이 테이블을 묶어서 배정해드려요.
                </p>
              )}
              {!isGroupWaiting && availableTables.length === 0 && (
                <p className="mt-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground">
                  현재 이용 가능한 테이블이 없어 원하는 자리 웨이팅은 선택할 수 없어요.
                </p>
              )}
            </div>
          )}

          {seatingPreference === "SPECIFIC" && !isChoiceLocked && (
            <div className="mt-5">
              <p className="text-xs font-medium text-muted-foreground">원하는 테이블</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {availableTables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => setSelectedTableId(table.id)}
                    className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
                      selectedTableId === table.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-foreground"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{getTableLabel(table)}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {getSeatLabel(table)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-auto px-5 pt-8 pb-2">
          <button
            disabled={
              phone.length < 10 ||
              submitting ||
              (seatingPreference === "SPECIFIC" && !selectedTableId)
            }
            onClick={registerWaiting}
            className="flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition disabled:opacity-40"
          >
            {submitting ? "등록 중..." : "웨이팅 등록하기"}
          </button>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl">
        <h1 className="flex-1 text-[15px] font-semibold">내 웨이팅</h1>
        <button className="text-xs text-muted-foreground">
          <X className="h-4 w-4" />
        </button>
      </header>

      <section className="px-5 pt-2">
        <div className="overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface to-surface p-6">
          <div className="flex items-center gap-2 text-[11px] font-medium text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            대기중
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{restaurant?.name ?? "매장"}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-[64px] font-bold leading-none tabular-nums">
              {isCancelled ? "-" : order}
            </span>
            <span className="text-base text-muted-foreground">
              {isCancelled ? "취소됨" : "번째"}
            </span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {entryPeople}명 · {currentEntry?.phone ?? phone}
          </p>
          {entryName && <p className="mt-1 text-xs text-primary">{entryName}님</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            {entryPreference}
            {entryTable ? ` · ${getTableLabel(entryTable)} (${getSeatLabel(entryTable)})` : ""}
            {!entryTable && selectedTable && seatingPreference === "SPECIFIC"
              ? ` · ${getTableLabel(selectedTable)} (${getSeatLabel(selectedTable)})`
              : ""}
          </p>
          {tableOrder && !isCancelled && (
            <p className="mt-2 inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary">
              이 테이블 {tableOrder}번째 예약
            </p>
          )}
        </div>

        {notificationMessage && !isCancelled && (
          <div className="mt-3 rounded-3xl border border-primary/30 bg-primary/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Bell className="h-4 w-4" />
              입장 안내가 도착했어요
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{notificationMessage}</p>
          </div>
        )}

        <ol className="mt-5 space-y-3">
          {[
            { label: "웨이팅 등록 완료", done: true },
            {
              label: isCancelled ? "웨이팅 취소 완료" : `내 앞으로 ${Math.max(0, order - 1)}팀 대기중`,
              done: isCancelled,
              active: !isCancelled,
            },
            {
              label: "입장 가능 알림 발송",
              done: Boolean(notificationMessage),
              active: Boolean(notificationMessage),
            },
            { label: "5분 내 매장 도착 (노쇼 방지)", done: false },
          ].map((s, i) => (
            <li key={i} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  s.done
                    ? "bg-status-empty text-primary-foreground"
                    : s.active
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface text-muted-foreground"
                }`}
              >
                {s.done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
              </div>
              <span
                className={`text-sm ${
                  s.active ? "font-semibold text-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-auto px-5 pb-2 pt-8">
        {submitError && <p className="mb-2 text-center text-[11px] text-destructive">{submitError}</p>}
        <button
          disabled={isCancelled || cancelling}
          onClick={cancelWaiting}
          className="flex h-12 w-full items-center justify-center rounded-2xl border border-border text-sm font-medium text-muted-foreground transition disabled:opacity-40"
        >
          {cancelling ? "취소 중..." : isCancelled ? "취소된 웨이팅" : "웨이팅 취소하기"}
        </button>
        <Link
          to="/waiting"
          className="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-surface text-sm font-medium text-muted-foreground"
        >
          내 웨이팅 목록 보기
        </Link>
      </section>
    </AppShell>
  );
}
