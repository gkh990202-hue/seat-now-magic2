import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, MapPin, Phone } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/StatusDot";
import { statusLabel, type TableStatus } from "@/lib/mock-data";
import { useRealtimeTables } from "@/hooks/useRealtimeTables";
import { supabase } from "@/integrations/supabase/client";
import {
  getSeatLabel,
  getStoredDoorPosition,
  getStoredDoorRotation,
  getStoredTableRotations,
  getTableLabel,
  getTablePosition,
  getTableSize,
  type TablePosition,
} from "@/lib/table-layout";

export const Route = createFileRoute("/store/$storeId")({
  component: StorePage,
});

const tableBg: Record<TableStatus, string> = {
  EMPTY: "bg-status-empty/15 border-status-empty/40 text-status-empty",
  OCCUPIED: "bg-status-occupied/15 border-status-occupied/40 text-status-occupied",
  CLEANING: "bg-status-cleaning/15 border-status-cleaning/40 text-status-cleaning",
  RESERVED: "bg-status-reserved/15 border-status-reserved/40 text-status-reserved",
};

type WaitingMode = "ANY" | "SPECIFIC";

function StorePage() {
  const { storeId } = Route.useParams();
  const navigate = useNavigate();
  const { tables, loading } = useRealtimeTables(storeId);
  const [restaurant, setRestaurant] = useState<{ name: string; address: string | null } | null>(
    null,
  );
  const [people, setPeople] = useState(2);
  const [waitingMode, setWaitingMode] = useState<WaitingMode | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [doorPosition, setDoorPosition] = useState<TablePosition>(getStoredDoorPosition);
  const [doorRotation, setDoorRotation] = useState(getStoredDoorRotation);
  const [rotations, setRotations] = useState<Record<string, number>>(getStoredTableRotations);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("restaurants")
        .select("name, address")
        .eq("id", storeId)
        .maybeSingle();
      if (data) setRestaurant(data);
    })();
  }, [storeId]);

  useEffect(() => {
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

  const counts = tables.reduce(
    (acc, t) => ({ ...acc, [t.status]: (acc[t.status] ?? 0) + 1 }),
    {} as Record<TableStatus, number>,
  );

  const hasAvailableTable = (counts.EMPTY ?? 0) > 0;
  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;
  const selectedTableIsAvailable = selectedTable?.status === "EMPTY";
  const maxPeople = Math.max(
    1,
    Math.min(4, waitingMode === "SPECIFIC" ? (selectedTable?.seats ?? 4) : 4),
  );
  const peopleOptions = Array.from({ length: maxPeople }, (_, index) => index + 1);

  useEffect(() => {
    if (people > maxPeople) {
      setPeople(maxPeople);
    }
  }, [maxPeople, people]);

  useEffect(() => {
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

  const selectWaitingMode = (mode: WaitingMode) => {
    setWaitingMode(mode);
    if (mode === "ANY") {
      setSelectedTableId(null);
    }
  };

  const startAnyWaiting = () => {
    navigate({
      to: "/waiting/$storeId",
      params: { storeId },
      search: { people, mode: "ANY" },
    });
  };

  const startTableWaiting = () => {
    if (!selectedTableId || !selectedTableIsAvailable) return;
    navigate({
      to: "/waiting/$storeId",
      params: { storeId },
      search: { people, mode: "SPECIFIC", preferredTableId: selectedTableId },
    });
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-20 flex items-center gap-3 bg-background/85 px-5 pt-12 pb-3 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-[15px] font-semibold">{restaurant?.name ?? "매장"}</h1>
        <span className="flex items-center gap-1.5 text-[11px] text-status-empty">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-empty opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-status-empty" />
          </span>
          LIVE
        </span>
      </header>

      <section className="px-5">
        <div className="flex items-center gap-4 rounded-3xl bg-surface p-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-elevated text-3xl">
            🍜
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{restaurant?.name ?? "—"}</h2>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {restaurant?.address ?? ""}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {(["EMPTY", "OCCUPIED", "CLEANING", "RESERVED"] as TableStatus[]).map((s) => (
            <div key={s} className="rounded-2xl bg-surface px-2 py-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <StatusDot status={s} />
                <span className="text-[10px] text-muted-foreground">{statusLabel[s]}</span>
              </div>
              <p className="mt-1 text-base font-bold tabular-nums">{counts[s] ?? 0}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <h3 className="mb-2 text-sm font-semibold">웨이팅 방식 선택</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => selectWaitingMode("ANY")}
            className={`rounded-2xl px-4 py-4 text-left transition-colors ${
              waitingMode === "ANY"
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground"
            }`}
          >
            <span className="block text-sm font-semibold">상관없음 웨이팅</span>
            <span className="mt-1 block text-[11px] opacity-80">빠른 자리 우선</span>
          </button>
          <button
            type="button"
            disabled={!hasAvailableTable}
            onClick={() => selectWaitingMode("SPECIFIC")}
            className={`rounded-2xl px-4 py-4 text-left transition-colors ${
              waitingMode === "SPECIFIC"
                ? "bg-primary text-primary-foreground"
                : !hasAvailableTable
                  ? "bg-surface text-muted-foreground opacity-45"
                  : "bg-surface text-muted-foreground"
            }`}
          >
            <span className="block text-sm font-semibold">원하는 자리 웨이팅</span>
            <span className="mt-1 block text-[11px] opacity-80">남은 자리 선택</span>
          </button>
        </div>
        {!hasAvailableTable && (
          <p className="mt-2 rounded-2xl bg-surface px-3 py-2 text-[11px] text-muted-foreground">
            원하는 자리 웨이팅은 이용 가능한 테이블이 있을 때만 선택할 수 있어요.
          </p>
        )}
      </section>

      {waitingMode === "SPECIFIC" && (
        <section className="mt-5 px-5">
          <h3 className="mb-2 text-sm font-semibold">실시간 테이블 현황</h3>
          <div className="rounded-3xl border border-border bg-card p-3">
            {loading ? (
              <p className="py-8 text-center text-xs text-muted-foreground">불러오는 중…</p>
            ) : tables.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                테이블 정보가 없습니다.
              </p>
            ) : (
              <div className="relative h-[320px] overflow-hidden rounded-2xl border border-border/60 bg-background/30">
                <DoorMarker position={doorPosition} rotation={doorRotation} />
                {tables.map((t) => (
                  <TableCard
                    key={t.id}
                    table={t}
                    rotation={rotations[t.id] ?? 0}
                    selected={selectedTableId === t.id}
                    disabled={t.status !== "EMPTY"}
                    onSelect={() => setSelectedTableId(t.id)}
                  />
                ))}
              </div>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground">
              이용 가능한 테이블만 선택할 수 있어요.
            </p>
          </div>
        </section>
      )}

      <section className="mt-6 px-5">
        {waitingMode === "ANY" && (
          <div className="rounded-3xl bg-surface p-4">
            <p className="text-[11px] font-medium text-primary">상관없음 웨이팅</p>
            <p className="mt-1 text-xs text-muted-foreground">
              자리 종류와 상관없이 가능한 자리부터 안내받아요.
            </p>
            <PeopleSelector people={people} peopleOptions={peopleOptions} onChange={setPeople} />
            <button
              type="button"
              onClick={startAnyWaiting}
              className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.99]"
            >
              {people}명 상관없음 웨이팅 등록
            </button>
          </div>
        )}
        {waitingMode === "SPECIFIC" &&
          (selectedTable ? (
            <div className="rounded-3xl bg-surface p-4">
              <p className="text-[11px] font-medium text-primary">선택한 테이블</p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-bold">{getTableLabel(selectedTable)}</p>
                  <p className="text-xs text-muted-foreground">{getSeatLabel(selectedTable)}</p>
                </div>
                <span className="rounded-full bg-background px-2.5 py-1 text-[11px] text-muted-foreground">
                  {statusLabel[selectedTable.status]}
                </span>
              </div>
              <PeopleSelector people={people} peopleOptions={peopleOptions} onChange={setPeople} />
              <p className="mt-2 text-[11px] text-muted-foreground">
                원하는 자리 웨이팅은 4인 이하만 가능합니다.
              </p>
              <button
                type="button"
                onClick={startTableWaiting}
                disabled={!selectedTableIsAvailable}
                className="mt-4 flex h-14 w-full items-center justify-center rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-glow transition-transform active:scale-[0.99] disabled:opacity-40"
              >
                {getTableLabel(selectedTable)} {people}명 웨이팅 등록
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-surface p-5 text-center">
              <p className="text-sm font-semibold">남아있는 테이블을 선택해주세요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                실시간 테이블 현황에서 이용 가능한 테이블을 누르면 인원을 선택할 수 있어요.
              </p>
            </div>
          ))}
        {!waitingMode && (
          <div className="rounded-3xl bg-surface p-5 text-center">
            <p className="text-sm font-semibold">웨이팅 방식을 먼저 선택해주세요</p>
            <p className="mt-1 text-xs text-muted-foreground">
              원하는 자리는 남은 테이블이 있을 때만 선택할 수 있어요.
            </p>
          </div>
        )}
        <a
          href="tel:0428265334"
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-medium text-muted-foreground"
        >
          <Phone className="h-4 w-4" />
          5인 이상 단체예약 문의
        </a>
      </section>
    </AppShell>
  );
}

function DoorMarker({ position, rotation }: { position: TablePosition; rotation: number }) {
  return (
    <div
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      className="absolute z-10 rounded-full border border-primary/50 bg-primary/20 px-3 py-1 shadow-card"
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

function PeopleSelector({
  people,
  peopleOptions,
  onChange,
}: {
  people: number;
  peopleOptions: number[];
  onChange: (people: number) => void;
}) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold">인원 선택</h3>
      <div className="flex gap-2">
        {peopleOptions.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-11 flex-1 rounded-xl text-sm font-semibold transition-colors ${
              people === n ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"
            }`}
          >
            {n}명
          </button>
        ))}
      </div>
    </div>
  );
}

function TableCard({
  table,
  rotation,
  selected,
  disabled,
  onSelect,
}: {
  table: {
    id: string;
    table_number: number;
    seats: number;
    status: TableStatus;
    occupied_at: string | null;
    layout_x: number | null;
    layout_y: number | null;
    layout_w: number | null;
    layout_h: number | null;
    table_label: string | null;
    seat_label: string | null;
  };
  rotation: number;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const position = getTablePosition(table);
  const size = getTableSize(table);
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: `${size.w}%`,
        height: `${size.h}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      }}
      className={`absolute min-h-[72px] min-w-[92px] rounded-2xl border p-2.5 text-left shadow-card transition ${
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      } ${disabled ? "cursor-not-allowed opacity-55" : "active:scale-[0.98]"} ${tableBg[table.status]}`}
    >
      <div style={{ transform: `rotate(${-rotation}deg)` }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold">{getTableLabel(table)}</span>
          <span className="flex items-center gap-1 text-[10px] font-medium">
            <StatusDot status={table.status} pulse={table.status === "OCCUPIED"} />
            {statusLabel[table.status]}
          </span>
        </div>
        <div className="mt-2 flex items-end justify-between">
          <span className="text-[11px] opacity-80">{getSeatLabel(table)}</span>
          <span className="text-[11px] font-semibold tabular-nums">
            {table.status === "OCCUPIED"
              ? "이용중"
              : table.status === "CLEANING"
                ? "정리중"
                : table.status === "RESERVED"
                  ? "예약됨"
                  : "이용 가능"}
          </span>
        </div>
      </div>
    </button>
  );
}
