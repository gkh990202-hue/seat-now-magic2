const DOOR_POSITION_STORAGE_KEY = "seatnow.onban.door-position.v1";
const DOOR_ROTATION_STORAGE_KEY = "seatnow.onban.door-rotation.v1";
const TABLE_ROTATIONS_STORAGE_KEY = "seatnow.onban.table-rotations.v1";
const DEFAULT_DOOR_POSITION = { x: 50, y: 92 };
const DEFAULT_TABLE_POSITIONS = {
  1: { x: 24, y: 28 },
  2: { x: 50, y: 28 },
  3: { x: 76, y: 28 },
  4: { x: 24, y: 68 },
  5: { x: 50, y: 68 },
  6: { x: 76, y: 68 }
};
function clampTablePosition(position) {
  return {
    x: Math.min(100, Math.max(0, position.x)),
    y: Math.min(100, Math.max(0, position.y))
  };
}
function clampDoorPosition(position) {
  return {
    x: Math.min(100, Math.max(0, position.x)),
    y: Math.min(100, Math.max(0, position.y))
  };
}
function getStoredDoorPosition() {
  if (typeof window === "undefined") return DEFAULT_DOOR_POSITION;
  const raw = window.localStorage.getItem(DOOR_POSITION_STORAGE_KEY);
  if (!raw) return DEFAULT_DOOR_POSITION;
  try {
    const parsed = JSON.parse(raw);
    return clampDoorPosition({
      x: typeof parsed.x === "number" ? parsed.x : DEFAULT_DOOR_POSITION.x,
      y: typeof parsed.y === "number" ? parsed.y : DEFAULT_DOOR_POSITION.y
    });
  } catch {
    return DEFAULT_DOOR_POSITION;
  }
}
function saveDoorPosition(position) {
  if (typeof window === "undefined") return;
  const next = clampDoorPosition(position);
  window.localStorage.setItem(DOOR_POSITION_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("seatnow-door-position"));
}
function normalizeTableRotation(value) {
  return (Math.round(value) % 360 + 360) % 360;
}
function getStoredDoorRotation() {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DOOR_ROTATION_STORAGE_KEY);
  return normalizeTableRotation(Number(raw) || 0);
}
function saveDoorRotation(rotation) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DOOR_ROTATION_STORAGE_KEY, String(normalizeTableRotation(rotation)));
  window.dispatchEvent(new Event("seatnow-door-rotation"));
}
function getStoredTableRotations() {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(TABLE_ROTATIONS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => typeof value === "number").map(([id, value]) => [id, normalizeTableRotation(value)])
    );
  } catch {
    return {};
  }
}
function saveTableRotation(tableId, rotation) {
  if (typeof window === "undefined") return;
  const rotations = getStoredTableRotations();
  rotations[tableId] = normalizeTableRotation(rotation);
  window.localStorage.setItem(TABLE_ROTATIONS_STORAGE_KEY, JSON.stringify(rotations));
  window.dispatchEvent(new Event("seatnow-table-rotations"));
}
function getTablePosition(table) {
  const fallback = DEFAULT_TABLE_POSITIONS[table.table_number] ?? { x: 50, y: 50 };
  return clampTablePosition({
    x: typeof table.layout_x === "number" ? table.layout_x : fallback.x,
    y: typeof table.layout_y === "number" ? table.layout_y : fallback.y
  });
}
function getTableSize(table) {
  return {
    w: Math.min(46, Math.max(20, typeof table.layout_w === "number" ? table.layout_w : 24)),
    h: Math.min(34, Math.max(16, typeof table.layout_h === "number" ? table.layout_h : 22))
  };
}
function getTableLabel(table) {
  return table.table_label?.trim() || `T${table.table_number}`;
}
function getSeatLabel(table) {
  return table.seat_label?.trim() || `${table.seats}인석`;
}
export {
  clampTablePosition as a,
  getStoredDoorPosition as b,
  clampDoorPosition as c,
  getStoredDoorRotation as d,
  getStoredTableRotations as e,
  getTableLabel as f,
  getSeatLabel as g,
  getTablePosition as h,
  getTableSize as i,
  saveDoorRotation as j,
  saveTableRotation as k,
  normalizeTableRotation as n,
  saveDoorPosition as s
};
