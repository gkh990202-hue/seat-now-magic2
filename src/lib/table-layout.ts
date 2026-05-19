export interface TablePosition {
  x: number;
  y: number;
}

export interface TableSize {
  w: number;
  h: number;
}

export const DOOR_POSITION_STORAGE_KEY = "seatnow.onban.door-position.v1";
export const DOOR_ROTATION_STORAGE_KEY = "seatnow.onban.door-rotation.v1";
export const TABLE_ROTATIONS_STORAGE_KEY = "seatnow.onban.table-rotations.v1";

export const DEFAULT_DOOR_POSITION: TablePosition = { x: 50, y: 92 };

export const DEFAULT_TABLE_POSITIONS: Record<number, TablePosition> = {
  1: { x: 24, y: 28 },
  2: { x: 50, y: 28 },
  3: { x: 76, y: 28 },
  4: { x: 24, y: 68 },
  5: { x: 50, y: 68 },
  6: { x: 76, y: 68 },
};

export function clampTablePosition(position: TablePosition): TablePosition {
  return {
    x: Math.min(100, Math.max(0, position.x)),
    y: Math.min(100, Math.max(0, position.y)),
  };
}

export function clampDoorPosition(position: TablePosition): TablePosition {
  return {
    x: Math.min(100, Math.max(0, position.x)),
    y: Math.min(100, Math.max(0, position.y)),
  };
}

export function getStoredDoorPosition(): TablePosition {
  if (typeof window === "undefined") return DEFAULT_DOOR_POSITION;
  const raw = window.localStorage.getItem(DOOR_POSITION_STORAGE_KEY);
  if (!raw) return DEFAULT_DOOR_POSITION;
  try {
    const parsed = JSON.parse(raw) as Partial<TablePosition>;
    return clampDoorPosition({
      x: typeof parsed.x === "number" ? parsed.x : DEFAULT_DOOR_POSITION.x,
      y: typeof parsed.y === "number" ? parsed.y : DEFAULT_DOOR_POSITION.y,
    });
  } catch {
    return DEFAULT_DOOR_POSITION;
  }
}

export function saveDoorPosition(position: TablePosition) {
  if (typeof window === "undefined") return;
  const next = clampDoorPosition(position);
  window.localStorage.setItem(DOOR_POSITION_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("seatnow-door-position"));
}

export function normalizeTableRotation(value: number) {
  return ((Math.round(value) % 360) + 360) % 360;
}

export function getStoredDoorRotation() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DOOR_ROTATION_STORAGE_KEY);
  return normalizeTableRotation(Number(raw) || 0);
}

export function saveDoorRotation(rotation: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOOR_ROTATION_STORAGE_KEY, String(normalizeTableRotation(rotation)));
  window.dispatchEvent(new Event("seatnow-door-rotation"));
}

export function getStoredTableRotations(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(TABLE_ROTATIONS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => typeof value === "number")
        .map(([id, value]) => [id, normalizeTableRotation(value as number)]),
    );
  } catch {
    return {};
  }
}

export function saveTableRotation(tableId: string, rotation: number) {
  if (typeof window === "undefined") return;
  const rotations = getStoredTableRotations();
  rotations[tableId] = normalizeTableRotation(rotation);
  window.localStorage.setItem(TABLE_ROTATIONS_STORAGE_KEY, JSON.stringify(rotations));
  window.dispatchEvent(new Event("seatnow-table-rotations"));
}

export function getTablePosition(table: {
  table_number: number;
  layout_x?: number | null;
  layout_y?: number | null;
}): TablePosition {
  const fallback = DEFAULT_TABLE_POSITIONS[table.table_number] ?? { x: 50, y: 50 };
  return clampTablePosition({
    x: typeof table.layout_x === "number" ? table.layout_x : fallback.x,
    y: typeof table.layout_y === "number" ? table.layout_y : fallback.y,
  });
}

export function getTableSize(table: {
  layout_w?: number | null;
  layout_h?: number | null;
}): TableSize {
  return {
    w: Math.min(46, Math.max(20, typeof table.layout_w === "number" ? table.layout_w : 24)),
    h: Math.min(34, Math.max(16, typeof table.layout_h === "number" ? table.layout_h : 22)),
  };
}

export function getTableLabel(table: { table_number: number; table_label?: string | null }) {
  return table.table_label?.trim() || `T${table.table_number}`;
}

export function getSeatLabel(table: { seats: number; seat_label?: string | null }) {
  return table.seat_label?.trim() || `${table.seats}인석`;
}
