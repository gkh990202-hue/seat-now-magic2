import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { BellRing, Move, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/StatusDot";
import { statusLabel, type TableStatus } from "@/lib/mock-data";
import { useFirstRestaurant, useRealtimeTables } from "@/hooks/useRealtimeTables";
import { supabase } from "@/integrations/supabase/client";
import { runSetTableStatus } from "@/lib/set-table-status";
import { useNow, formatElapsed } from "@/lib/elapsed";
import { isWaitingPreferenceSchemaError, normalizeWaitingPreference } from "@/lib/waiting-preferences";
import { useAppSession } from "@/lib/auth-session";
import {
  getWaitingNotificationChannelName,
  WAITING_NOTIFICATION_EVENT,
  type WaitingNotificationPayload,
} from "@/lib/waiting-notifications";
import {
  clampDoorPosition,
  clampTablePosition,
  getSeatLabel,
  getStoredDoorPosition,
  getStoredDoorRotation,
  getStoredTableRotations,
  getTableLabel,
  getTablePosition,
  getTableSize,
  normalizeTableRotation,
  saveDoorPosition,
  saveDoorRotation,
  saveTableRotation,
  type TablePosition,
  type TableSize,
} from "@/lib/table-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const ALL_STATUSES: TableStatus[] = ["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"];

const tableBg: Record<TableStatus, string> = {
  EMPTY: "bg-status-empty/15 border-status-empty/40 text-status-empty",
  OCCUPIED: "bg-status-occupied/15 border-status-occupied/40 text-status-occupied",
  CLEANING: "bg-status-cleaning/15 border-status-cleaning/40 text-status-cleaning",
  RESERVED: "bg-status-reserved/15 border-status-reserved/40 text-status-reserved",
};

const TABLE_GROUPS_STORAGE_KEY = "seatnow.onban.table-groups.v1";

interface TableGroup {
  id: string;
  tableIds: string[];
}

interface WaitingEntry {
  id: string;
  phone: string;
  people: number;
  seating_preference: string;
  preferred_table_id: string | null;
  customer_name: string | null;
  created_at: string;
}

function AdminPage() {
  const session = useAppSession();
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useFirstRestaurant();
  const { tables, loading: tablesLoading } = useRealtimeTables(restaurant?.id);
  const [layoutEditing, setLayoutEditing] = useState(false);
  const [positions, setPositions] = useState<Record<string, TablePosition>>({});
  const [sizes, setSizes] = useState<Record<string, TableSize>>({});
  const [rotations, setRotations] = useState<Record<string, number>>({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [waitingEntries, setWaitingEntries] = useState<WaitingEntry[]>([]);
  const [groupEntryId, setGroupEntryId] = useState<string | null>(null);
  const [groupTableIds, setGroupTableIds] = useState<string[]>([]);
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [doorPosition, setDoorPosition] = useState<TablePosition>(getStoredDoorPosition);
  const [doorRotation, setDoorRotation] = useState(getStoredDoorRotation);

  const counts = tables.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }),
    {} as Record<TableStatus, number>,
  );

  useEffect(() => {
    setPositions(Object.fromEntries(tables.map((t) => [t.id, getTablePosition(t)])));
    setSizes(Object.fromEntries(tables.map((t) => [t.id, getTableSize(t)])));
  }, [tables]);

  useEffect(() => {
    const raw = window.localStorage.getItem(TABLE_GROUPS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as TableGroup[];
      setTableGroups(
        parsed.filter(
          (group) =>
            typeof group.id === "string" &&
            Array.isArray(group.tableIds) &&
            group.tableIds.every((id) => typeof id === "string"),
        ),
      );
    } catch {
      setTableGroups([]);
    }
  }, []);

  useEffect(() => {
    setRotations(getStoredTableRotations());
    const syncTableRotations = () => setRotations(getStoredTableRotations());
    window.addEventListener("storage", syncTableRotations);
    window.addEventListener("seatnow-table-rotations", syncTableRotations);
    return () => {
      window.removeEventListener("storage", syncTableRotations);
      window.removeEventListener("seatnow-table-rotations", syncTableRotations);
    };
  }, []);

  useEffect(() => {
    const syncDoorPosition = () => setDoorPosition(getStoredDoorPosition());
    const syncDoorRotation = () => setDoorRotation(getStoredDoorRotation());
    window.addEventListener("storage", syncDoorPosition);
    window.addEventListener("seatnow-door-position", syncDoorPosition);
    window.addEventListener("storage", syncDoorRotation);
    window.addEventListener("seatnow-door-rotation", syncDoorRotation);
    return () => {
      window.removeEventListener("storage", syncDoorPosition);
      window.removeEventListener("seatnow-door-position", syncDoorPosition);
      window.removeEventListener("storage", syncDoorRotation);
      window.removeEventListener("seatnow-door-rotation", syncDoorRotation);
    };
  }, []);

  useEffect(() => {
    if (!restaurant?.id) {
      setWaitingEntries([]);
      return;
    }

    let active = true;
    const loadWaiting = async () => {
      const { data, error } = await supabase
        .from("waiting_entries")
        .select("id, phone, people, seating_preference, preferred_table_id, created_at")
        .eq("restaurant_id", restaurant.id)
        .eq("status", "WAITING")
        .order("created_at");
      if (!active) return;
      if (error && !isWaitingPreferenceSchemaError(error)) {
        console.error("[AdminPage] waiting_entries", error.message);
        setWaitingEntries([]);
        return;
      }
      let waitingData = data;
      if (isWaitingPreferenceSchemaError(error)) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("waiting_entries")
          .select("id, phone, people, created_at")
          .eq("restaurant_id", restaurant.id)
          .eq("status", "WAITING")
          .order("created_at");
        if (!active) return;
        if (fallbackError) {
          console.error("[AdminPage] waiting_entries", fallbackError.message);
          setWaitingEntries([]);
          return;
        }
        waitingData = fallbackData as typeof data;
      }
      setWaitingEntries(
        (waitingData ?? []).map((entry) => {
          const preference = normalizeWaitingPreference(entry);
          return {
            ...entry,
            phone: preference.phone,
            seating_preference: preference.seating_preference,
            preferred_table_id: preference.preferred_table_id,
            customer_name: preference.customer_name,
          };
        }) as WaitingEntry[],
      );
    };

    loadWaiting();
    const channel = supabase
      .channel(`admin-waiting:${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiting_entries",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        loadWaiting,
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id]);

  const changeStatus = async (id: string, current: TableStatus, next: TableStatus) => {
    if (current === next) return;
    try {
      await runSetTableStatus(supabase, {
        table_id: id,
        new_status: next,
        source: "admin",
        payload: { via: "admin-ui" },
      });
      toast.success(`${statusLabel[current]} → ${statusLabel[next]}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "변경 실패");
    }
  };

  const cancelWaitingEntry = async (id: string) => {
    const { error } = await supabase
      .from("waiting_entries")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(`웨이팅 취소 실패: ${error.message}`);
      return;
    }
    toast.success("웨이팅을 취소했습니다");
  };

  const notifyWaitingEntry = (entry: WaitingEntry) => {
    const message = "입장 준비가 되었어요. 5분 내 매장으로 와주세요.";
    const payload: WaitingNotificationPayload = {
      entryId: entry.id,
      restaurantName: restaurant?.name ?? "온반",
      message,
      sentAt: new Date().toISOString(),
    };
    const channel = supabase.channel(getWaitingNotificationChannelName(entry.id));
    let completed = false;
    const timer = window.setTimeout(() => {
      if (completed) return;
      completed = true;
      supabase.removeChannel(channel);
      toast.error("알림 채널 연결에 실패했습니다. 고객 웨이팅 화면이 열려있는지 확인해주세요.");
    }, 3_000);

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED" || completed) return;
      window.clearTimeout(timer);
      const result = await channel.send({
        type: "broadcast",
        event: WAITING_NOTIFICATION_EVENT,
        payload,
      });
      completed = true;
      supabase.removeChannel(channel);
      if (result === "ok") {
        toast.success(`${entry.phone} 고객에게 입장 알림을 보냈습니다`);
        return;
      }
      toast.error("알림 발송에 실패했습니다");
    });
  };

  const toggleGroupTable = (id: string) => {
    setGroupTableIds((prev) =>
      prev.includes(id) ? prev.filter((tableId) => tableId !== id) : [...prev, id],
    );
  };

  const saveTableGroups = (groups: TableGroup[]) => {
    setTableGroups(groups);
    window.localStorage.setItem(TABLE_GROUPS_STORAGE_KEY, JSON.stringify(groups));
  };

  const applyGroupedTableStatus = async (nextStatus: TableStatus, existingTableIds = groupTableIds) => {
    const entry = waitingEntries.find((item) => item.id === groupEntryId);
    if (existingTableIds.length < 2) {
      toast.error("묶을 테이블을 2개 이상 선택해주세요");
      return;
    }

    try {
      await Promise.all(
        existingTableIds.map((tableId) => {
          const table = tables.find((item) => item.id === tableId);
          if (!table || table.status === nextStatus) return Promise.resolve();
          return runSetTableStatus(supabase, {
            table_id: tableId,
            new_status: nextStatus,
            source: "admin-group",
            payload: {
              waiting_entry_id: entry?.id ?? null,
              people: entry?.people ?? null,
              phone: entry?.phone ?? null,
              grouped_table_ids: existingTableIds,
            },
          });
        }),
      );
      if (existingTableIds === groupTableIds) {
        const nextGroup: TableGroup = { id: `${Date.now()}`, tableIds: groupTableIds };
        saveTableGroups([...tableGroups, nextGroup]);
      }
      setGroupEntryId(null);
      setGroupTableIds([]);
      toast.success(
        entry
          ? `${entry.people}명 단체 테이블을 ${statusLabel[nextStatus]}으로 묶었습니다`
          : `선택한 테이블을 ${statusLabel[nextStatus]}으로 묶었습니다`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "단체 테이블 묶기 실패");
    }
  };

  const removeTableGroup = (id: string) => {
    saveTableGroups(tableGroups.filter((group) => group.id !== id));
    toast.success("테이블 묶음을 해제했습니다");
  };

  const changeLayout = async (id: string, position: TablePosition) => {
    const next = clampTablePosition(position);
    setPositions((prev) => ({ ...prev, [id]: next }));
    const { error } = await supabase
      .from("restaurant_tables")
      .update({
        layout_x: next.x,
        layout_y: next.y,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error(`배치 저장 실패: ${error.message}`);
      return;
    }
    toast.success("테이블 배치를 저장했습니다");
  };

  const changeDoorPosition = (position: TablePosition) => {
    const next = clampDoorPosition(position);
    setDoorPosition(next);
    saveDoorPosition(next);
    toast.success("출입문 위치를 저장했습니다");
  };

  const changeDoorRotation = (rotation: number) => {
    const next = normalizeTableRotation(rotation);
    setDoorRotation(next);
    saveDoorRotation(next);
  };

  const changeTableRotation = (id: string, rotation: number) => {
    const next = normalizeTableRotation(rotation);
    setRotations((prev) => ({ ...prev, [id]: next }));
    saveTableRotation(id, next);
  };

  const changeTableMeta = async (
    id: string,
    patch: {
      table_label?: string;
      seat_label?: string;
      layout_w?: number;
      layout_h?: number;
    },
  ) => {
    const { error } = await supabase
      .from("restaurant_tables")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error(`테이블 수정 실패: ${error.message}`);
      return;
    }
    toast.success("테이블 정보를 저장했습니다");
  };

  const tableById = useMemo(() => new Map(tables.map((table) => [table.id, table])), [tables]);
  const anyWaitingEntries = waitingEntries.filter(
    (entry) => entry.seating_preference !== "SPECIFIC" || !entry.preferred_table_id,
  );
  const groupWaitingEntries = waitingEntries.filter((entry) => entry.people > 4);
  const deletedTableEntries = waitingEntries.filter(
    (entry) =>
      entry.seating_preference === "SPECIFIC" &&
      entry.preferred_table_id &&
      !tableById.has(entry.preferred_table_id),
  );
  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? tables[0];

  if (session.role !== "business") {
    return (
      <AppShell>
        <section className="flex flex-1 flex-col justify-center px-5">
          <div className="rounded-3xl bg-surface p-6 text-center">
            <h1 className="text-xl font-bold">사업자회원 로그인이 필요합니다</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              사장님 화면은 온반 사업자 로그인 후 사용할 수 있어요.
            </p>
            <Link
              to="/auth"
              className="mt-5 flex h-12 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              사업자회원 로그인
            </Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="px-5 pt-12 pb-3">
        <div className="mt-0.5 flex items-end justify-between">
          <h1 className="text-[22px] font-bold tracking-tight">
            {restaurantError
              ? `매장 로딩 실패: ${restaurantError}`
              : restaurantLoading
                ? "매장 로딩…"
                : (restaurant?.name ?? "등록된 매장이 없습니다")}
          </h1>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            실시간 동기화
          </span>
        </div>
      </header>

      <section className="px-5 pt-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">대기 현황</h3>
          <span className="text-[10px] text-muted-foreground">{waitingEntries.length}팀 대기</span>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4">
          {waitingEntries.length === 0 ? (
            <p className="py-5 text-center text-xs text-muted-foreground">
              현재 등록된 웨이팅이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              <WaitingGroup title="상관없음" count={anyWaitingEntries.length}>
                {anyWaitingEntries.length === 0 ? (
                  <EmptyWaitingMessage />
                ) : (
                  anyWaitingEntries.map((entry) => (
                    <WaitingEntryRow
                      key={entry.id}
                      entry={entry}
                      order={waitingEntries.findIndex((item) => item.id === entry.id) + 1}
                      label="빠른 자리 우선"
                      onCancel={cancelWaitingEntry}
                      onNotify={notifyWaitingEntry}
                    />
                  ))
                )}
              </WaitingGroup>

              {tables.map((table) => {
                const tableEntries = waitingEntries.filter(
                  (entry) =>
                    entry.seating_preference === "SPECIFIC" &&
                    entry.preferred_table_id === table.id,
                );
                return (
                  <WaitingGroup
                    key={table.id}
                    title={`${getTableLabel(table)} · ${getSeatLabel(table)}`}
                    count={tableEntries.length}
                  >
                    {tableEntries.length === 0 ? (
                      <EmptyWaitingMessage />
                    ) : (
                      tableEntries.map((entry, index) => (
                        <WaitingEntryRow
                          key={entry.id}
                          entry={entry}
                          order={waitingEntries.findIndex((item) => item.id === entry.id) + 1}
                          label={`원하는 자리 웨이팅 · 이 테이블 ${index + 1}번째`}
                          onCancel={cancelWaitingEntry}
                          onNotify={notifyWaitingEntry}
                        />
                      ))
                    )}
                  </WaitingGroup>
                );
              })}

              {deletedTableEntries.length > 0 && (
                <WaitingGroup title="삭제된 테이블" count={deletedTableEntries.length}>
                  {deletedTableEntries.map((entry) => (
                    <WaitingEntryRow
                      key={entry.id}
                      entry={entry}
                      order={waitingEntries.findIndex((item) => item.id === entry.id) + 1}
                      label="원하는 자리 웨이팅"
                      onCancel={cancelWaitingEntry}
                      onNotify={notifyWaitingEntry}
                    />
                  ))}
                </WaitingGroup>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">단체 테이블 묶기</h3>
          <span className="text-[10px] text-muted-foreground">
            {groupWaitingEntries.length > 0 ? `5인 이상 ${groupWaitingEntries.length}팀` : "테이블 직접 선택"}
          </span>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4">
          <p className="text-[11px] text-muted-foreground">
            T4와 T5처럼 여러 테이블을 선택해서 단체용으로 묶을 수 있습니다.
          </p>

          {groupWaitingEntries.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground">단체 웨이팅 연결</p>
              {groupWaitingEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setGroupEntryId(entry.id);
                    setGroupTableIds([]);
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left ${
                    groupEntryId === entry.id
                      ? "bg-primary/15 text-primary"
                      : "bg-surface text-foreground"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-semibold">{entry.people}명 단체</span>
                    <span className="text-[11px] text-muted-foreground">
                      {entry.customer_name ? `${entry.customer_name} · ` : ""}
                      {entry.phone}
                    </span>
                  </span>
                  <span className="text-[11px] font-semibold">
                    {groupEntryId === entry.id ? "연결됨" : "선택"}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2">
            {tables.map((table) => {
              const selected = groupTableIds.includes(table.id);
              return (
                <button
                  key={table.id}
                  onClick={() => toggleGroupTable(table.id)}
                  className={`rounded-2xl border px-2 py-2 text-left ${
                    selected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-surface text-foreground"
                  }`}
                >
                  <span className="block text-xs font-bold">{getTableLabel(table)}</span>
                  <span className="block text-[10px] text-muted-foreground">
                    {getSeatLabel(table)}
                  </span>
                </button>
              );
            })}
          </div>

          {tableGroups.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground">현재 묶음</p>
              {tableGroups.map((group, index) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between rounded-2xl bg-surface px-3 py-2"
                >
                  <span className="text-xs font-semibold">
                    묶음 {index + 1} ·{" "}
                    {group.tableIds
                      .map((id) => tables.find((table) => table.id === id))
                      .filter(Boolean)
                      .map((table) => getTableLabel(table!))
                      .join(" + ")}
                  </span>
                  <button
                    onClick={() => applyGroupedTableStatus("OCCUPIED", group.tableIds)}
                    className="text-[11px] font-semibold text-status-occupied"
                  >
                    사용중
                  </button>
                  <button
                    onClick={() => applyGroupedTableStatus("RESERVED", group.tableIds)}
                    className="text-[11px] font-semibold text-status-reserved"
                  >
                    예약
                  </button>
                  <button
                    onClick={() => removeTableGroup(group.id)}
                    className="text-[11px] font-semibold text-muted-foreground"
                  >
                    해제
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => applyGroupedTableStatus("RESERVED")}
              className="flex h-11 items-center justify-center rounded-2xl bg-status-reserved/20 text-sm font-semibold text-status-reserved"
            >
              예약으로 묶기
            </button>
            <button
              onClick={() => applyGroupedTableStatus("OCCUPIED")}
              className="flex h-11 items-center justify-center rounded-2xl bg-status-occupied/20 text-sm font-semibold text-status-occupied"
            >
              사용중으로 묶기
            </button>
          </div>
        </div>
      </section>

      <section className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">테이블 현황</h3>
          <div className="flex items-center gap-2">
            <div className="hidden gap-2 text-[10px] text-muted-foreground min-[420px]:flex">
              {(["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"] as TableStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <StatusDot status={s} />
                  {statusLabel[s]} {counts[s] ?? 0}
                </span>
              ))}
            </div>
            <button
              onClick={() => setLayoutEditing((v) => !v)}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                layoutEditing
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground"
              }`}
            >
              <Move className="h-3 w-3" />
              {layoutEditing ? "배치 편집중" : "배치 편집"}
            </button>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4">
          {tablesLoading ? (
            <p className="py-10 text-center text-xs text-muted-foreground">테이블을 불러오는 중…</p>
          ) : tables.length === 0 ? (
            <p className="py-10 text-center text-xs text-muted-foreground">
              등록된 테이블이 없습니다.
            </p>
          ) : (
            <AdminTableBoard
              editing={layoutEditing}
              doorPosition={doorPosition}
              doorRotation={doorRotation}
              positions={positions}
              rotations={rotations}
              sizes={sizes}
              tables={tables}
              onMove={changeLayout}
              onMoveDoor={changeDoorPosition}
              onSelectTable={setSelectedTableId}
              onSelect={changeStatus}
              onPreviewDoorMove={(position) => setDoorPosition(clampDoorPosition(position))}
              onPreviewMove={(id, position) =>
                setPositions((prev) => ({ ...prev, [id]: clampTablePosition(position) }))
              }
            />
          )}
          {layoutEditing && selectedTable && (
            <TableEditPanel
              key={selectedTable.id}
              table={selectedTable}
              size={sizes[selectedTable.id] ?? getTableSize(selectedTable)}
              rotation={rotations[selectedTable.id] ?? 0}
              onChangeSize={(size) => {
                setSizes((prev) => ({ ...prev, [selectedTable.id]: size }));
                changeTableMeta(selectedTable.id, {
                  layout_w: size.w,
                  layout_h: size.h,
                });
              }}
              onChangeRotation={(rotation) => changeTableRotation(selectedTable.id, rotation)}
              onSave={(patch) => changeTableMeta(selectedTable.id, patch)}
            />
          )}
          {layoutEditing && (
            <DoorEditPanel rotation={doorRotation} onChangeRotation={changeDoorRotation} />
          )}
          <p className="mt-3 text-center text-[10px] text-muted-foreground">
            {layoutEditing
              ? "테이블과 출입문을 끌어서 옮기고, 아래에서 이름과 크기를 조절하세요"
              : "테이블을 탭해서 상태를 선택하세요 — 변경 즉시 DB와 로그에 기록됩니다"}
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function WaitingGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold">{title}</p>
        <span className="text-[10px] text-muted-foreground">{count}팀</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function EmptyWaitingMessage() {
  return <p className="py-2 text-center text-[11px] text-muted-foreground">대기 없음</p>;
}

function WaitingEntryRow({
  entry,
  order,
  label,
  onCancel,
  onNotify,
}: {
  entry: WaitingEntry;
  order: number;
  label: string;
  onCancel: (id: string) => void;
  onNotify: (entry: WaitingEntry) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-background/60 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{order}번째</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {entry.customer_name ? `${entry.customer_name} · ` : ""}
          {entry.phone} · {label}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">
          {entry.people}명
        </span>
        <button
          onClick={() => onNotify(entry)}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
        >
          <BellRing className="h-3 w-3" />
          입장 알림
        </button>
        <button
          onClick={() => onCancel(entry.id)}
          className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive"
        >
          예약취소
        </button>
      </div>
    </div>
  );
}

interface AdminTable {
  id: string;
  table_number: number;
  seats: number;
  seat_label: string | null;
  table_label: string | null;
  status: TableStatus;
  occupied_at: string | null;
  layout_x: number | null;
  layout_y: number | null;
  layout_w: number | null;
  layout_h: number | null;
}

function AdminTableBoard({
  editing,
  doorPosition,
  doorRotation,
  positions,
  rotations,
  sizes,
  tables,
  onMove,
  onMoveDoor,
  onPreviewMove,
  onPreviewDoorMove,
  onSelectTable,
  onSelect,
}: {
  editing: boolean;
  doorPosition: TablePosition;
  doorRotation: number;
  positions: Record<string, TablePosition>;
  rotations: Record<string, number>;
  sizes: Record<string, TableSize>;
  tables: AdminTable[];
  onMove: (id: string, position: TablePosition) => void;
  onMoveDoor: (position: TablePosition) => void;
  onPreviewMove: (id: string, position: TablePosition) => void;
  onPreviewDoorMove: (position: TablePosition) => void;
  onSelectTable: (id: string) => void;
  onSelect: (id: string, current: TableStatus, next: TableStatus) => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ type: "table"; id: string; pointerId: number } | { type: "door"; pointerId: number } | null>(
    null,
  );

  const positionFromPointer = (event: PointerEvent): TablePosition | null => {
    const board = boardRef.current;
    if (!board) return null;
    const rect = board.getBoundingClientRect();
    return clampTablePosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const startDrag = (id: string, event: PointerEvent<HTMLDivElement>) => {
    if (!editing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { type: "table", id, pointerId: event.pointerId };
    const next = positionFromPointer(event);
    if (next) onPreviewMove(id, next);
  };

  const startDoorDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!editing) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { type: "door", pointerId: event.pointerId };
    const next = positionFromPointer(event);
    if (next) onPreviewDoorMove(next);
  };

  const moveDrag = (id: string, event: PointerEvent<HTMLDivElement>) => {
    if (!editing || dragRef.current?.type !== "table" || dragRef.current.id !== id) return;
    const next = positionFromPointer(event);
    if (next) onPreviewMove(id, next);
  };

  const moveDoorDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!editing || dragRef.current?.type !== "door") return;
    const next = positionFromPointer(event);
    if (next) onPreviewDoorMove(next);
  };

  const endDrag = (id: string, event: PointerEvent<HTMLDivElement>) => {
    if (!editing || dragRef.current?.type !== "table" || dragRef.current.id !== id) return;
    const next =
      positionFromPointer(event) ?? positions[id] ?? getTablePosition({ table_number: 1 });
    dragRef.current = null;
    onMove(id, next);
  };

  const endDoorDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!editing || dragRef.current?.type !== "door") return;
    const next = positionFromPointer(event) ?? doorPosition;
    dragRef.current = null;
    onMoveDoor(next);
  };

  return (
    <div
      ref={boardRef}
      className="relative h-[320px] overflow-hidden rounded-2xl border border-border/70 bg-background/35 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px]"
    >
      <AdminDoorMarker
        editing={editing}
        position={doorPosition}
        rotation={doorRotation}
        onPointerDown={startDoorDrag}
        onPointerMove={moveDoorDrag}
        onPointerUp={endDoorDrag}
        onPointerCancel={endDoorDrag}
      />
      {tables.map((table) => {
        const position = positions[table.id] ?? getTablePosition(table);
        const size = sizes[table.id] ?? getTableSize(table);
        const rotation = rotations[table.id] ?? 0;
        const style = {
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: `${size.w}%`,
          height: `${size.h}%`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        };

        if (editing) {
          return (
            <div
              key={table.id}
              style={style}
              onPointerDown={(event) => startDrag(table.id, event)}
              onPointerMove={(event) => moveDrag(table.id, event)}
              onPointerUp={(event) => endDrag(table.id, event)}
              onPointerCancel={(event) => endDrag(table.id, event)}
              onClick={() => onSelectTable(table.id)}
              className={`absolute min-h-[72px] min-w-[92px] cursor-grab touch-none rounded-2xl border p-2.5 text-left shadow-card transition-transform active:cursor-grabbing active:scale-95 ${tableBg[table.status]}`}
            >
              <AdminTableContent table={table} rotation={rotation} />
            </div>
          );
        }

        return (
          <div key={table.id} style={style} className="absolute min-h-[72px] min-w-[92px]">
            <AdminTableCell
              table={table}
              rotation={rotation}
              onSelect={(next) => onSelect(table.id, table.status, next)}
            />
          </div>
        );
      })}
    </div>
  );
}

function AdminDoorMarker({
  editing,
  position,
  rotation,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  editing: boolean;
  position: TablePosition;
  rotation: number;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className={`absolute z-20 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 shadow-card ${
        editing ? "cursor-grab touch-none active:cursor-grabbing" : ""
      }`}
    >
      <span
        style={{ transform: `rotate(${-rotation}deg)` }}
        className="block text-[11px] font-bold text-primary"
      >
        출입문
      </span>
    </div>
  );
}

function AdminTableContent({ table, rotation = 0 }: { table: AdminTable; rotation?: number }) {
  const now = useNow(30_000);
  const elapsed = table.status === "OCCUPIED" ? formatElapsed(table.occupied_at, now) : "";
  return (
    <div style={{ transform: `rotate(${-rotation}deg)` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold">{getTableLabel(table)}</span>
        <StatusDot status={table.status} pulse={table.status === "OCCUPIED"} />
      </div>
      <span className="mt-1 block text-[10px] opacity-80">{getSeatLabel(table)}</span>
      <span className="mt-1 block text-[10px] font-semibold tabular-nums">
        {table.status === "OCCUPIED" ? elapsed || "방금 착석" : statusLabel[table.status]}
      </span>
    </div>
  );
}

function AdminTableCell({
  table,
  rotation,
  onSelect,
}: {
  table: AdminTable;
  rotation: number;
  onSelect: (next: TableStatus) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`flex w-full flex-col rounded-2xl border p-2.5 text-left shadow-card transition-transform active:scale-95 ${tableBg[table.status]}`}
        >
          <AdminTableContent table={table} rotation={rotation} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {ALL_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onSelect={() => onSelect(s)}>
            <StatusDot status={s} />
            <span className="ml-2">{statusLabel[s]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableEditPanel({
  table,
  size,
  rotation,
  onChangeSize,
  onChangeRotation,
  onSave,
}: {
  table: AdminTable;
  size: TableSize;
  rotation: number;
  onChangeSize: (size: TableSize) => void;
  onChangeRotation: (rotation: number) => void;
  onSave: (patch: { table_label?: string; seat_label?: string }) => void;
}) {
  const [tableLabel, setTableLabel] = useState(getTableLabel(table));
  const [seatLabel, setSeatLabel] = useState(getSeatLabel(table));

  useEffect(() => {
    setTableLabel(getTableLabel(table));
    setSeatLabel(getSeatLabel(table));
  }, [table]);

  return (
    <div className="mt-3 rounded-2xl bg-surface p-3">
      <p className="text-[11px] font-semibold text-muted-foreground">선택 테이블 편집</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-[10px] text-muted-foreground">
          테이블 이름
          <input
            value={tableLabel}
            onChange={(event) => setTableLabel(event.target.value)}
            onBlur={() => onSave({ table_label: tableLabel.trim() || getTableLabel(table) })}
            className="mt-1 h-9 w-full rounded-xl bg-background px-3 text-xs text-foreground outline-none ring-1 ring-border focus:ring-primary"
          />
        </label>
        <label className="text-[10px] text-muted-foreground">
          좌석 이름
          <input
            value={seatLabel}
            onChange={(event) => setSeatLabel(event.target.value)}
            onBlur={() => onSave({ seat_label: seatLabel.trim() || getSeatLabel(table) })}
            className="mt-1 h-9 w-full rounded-xl bg-background px-3 text-xs text-foreground outline-none ring-1 ring-border focus:ring-primary"
          />
        </label>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-[10px] text-muted-foreground">
          가로 크기
          <input
            type="range"
            min={22}
            max={46}
            value={size.w}
            onChange={(event) => onChangeSize({ ...size, w: Number(event.target.value) })}
            className="mt-2 w-full"
          />
        </label>
        <label className="text-[10px] text-muted-foreground">
          세로 크기
          <input
            type="range"
            min={16}
            max={34}
            value={size.h}
            onChange={(event) => onChangeSize({ ...size, h: Number(event.target.value) })}
            className="mt-2 w-full"
          />
        </label>
      </div>
      <label className="mt-3 block text-[10px] text-muted-foreground">
        회전 각도
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={rotation}
            onChange={(event) => onChangeRotation(Number(event.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right text-xs font-semibold text-foreground tabular-nums">
            {rotation}°
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[0, 90, 180, 270].map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => onChangeRotation(angle)}
              className={`rounded-xl px-2 py-1.5 text-[10px] font-semibold ${
                rotation === angle
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {angle}°
            </button>
          ))}
        </div>
      </label>
    </div>
  );
}

function DoorEditPanel({
  rotation,
  onChangeRotation,
}: {
  rotation: number;
  onChangeRotation: (rotation: number) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl bg-surface p-3">
      <p className="text-[11px] font-semibold text-muted-foreground">출입문 편집</p>
      <label className="mt-3 block text-[10px] text-muted-foreground">
        출입문 회전 각도
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={rotation}
            onChange={(event) => onChangeRotation(Number(event.target.value))}
            className="flex-1"
          />
          <span className="w-12 text-right text-xs font-semibold text-foreground tabular-nums">
            {rotation}°
          </span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {[0, 90, 180, 270].map((angle) => (
            <button
              key={angle}
              type="button"
              onClick={() => onChangeRotation(angle)}
              className={`rounded-xl px-2 py-1.5 text-[10px] font-semibold ${
                rotation === angle
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {angle}°
            </button>
          ))}
        </div>
      </label>
    </div>
  );
}
