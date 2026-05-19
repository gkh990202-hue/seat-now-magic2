export type TableStatus = "EMPTY" | "OCCUPIED" | "CLEANING" | "RESERVED";

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  rating: number;
  emptyCount: number;
  totalTables: number;
  waitingCount: number;
  estimatedWait: number; // minutes
  image: string;
  busyLevel: "low" | "medium" | "high";
}

export interface TableInfo {
  id: string;
  number: number;
  seats: number;
  status: TableStatus;
  remainingMinutes?: number;
  x: number; // grid position
  y: number;
}

export const restaurants: Restaurant[] = [
  {
    id: "r1",
    name: "성수 라멘공방",
    category: "일식 · 라멘",
    address: "서울 성동구 성수동",
    rating: 4.8,
    emptyCount: 2,
    totalTables: 12,
    waitingCount: 6,
    estimatedWait: 18,
    image: "🍜",
    busyLevel: "high",
  },
  {
    id: "r2",
    name: "을지로 화로상회",
    category: "한식 · 고기",
    address: "서울 중구 을지로",
    rating: 4.6,
    emptyCount: 5,
    totalTables: 14,
    waitingCount: 1,
    estimatedWait: 5,
    image: "🥩",
    busyLevel: "medium",
  },
  {
    id: "r3",
    name: "연남 파스타바",
    category: "양식 · 파스타",
    address: "서울 마포구 연남동",
    rating: 4.7,
    emptyCount: 0,
    totalTables: 10,
    waitingCount: 9,
    estimatedWait: 32,
    image: "🍝",
    busyLevel: "high",
  },
  {
    id: "r4",
    name: "한남 브런치하우스",
    category: "브런치 · 카페",
    address: "서울 용산구 한남동",
    rating: 4.5,
    emptyCount: 8,
    totalTables: 16,
    waitingCount: 0,
    estimatedWait: 0,
    image: "🥐",
    busyLevel: "low",
  },
  {
    id: "r5",
    name: "압구정 스시오마카세",
    category: "일식 · 스시",
    address: "서울 강남구 압구정동",
    rating: 4.9,
    emptyCount: 1,
    totalTables: 8,
    waitingCount: 3,
    estimatedWait: 22,
    image: "🍣",
    busyLevel: "high",
  },
  {
    id: "r6",
    name: "망원 타코스",
    category: "양식 · 멕시칸",
    address: "서울 마포구 망원동",
    rating: 4.4,
    emptyCount: 4,
    totalTables: 9,
    waitingCount: 0,
    estimatedWait: 0,
    image: "🌮",
    busyLevel: "low",
  },
];

export const generateTables = (restaurantId: string): TableInfo[] => {
  const seed = restaurantId.charCodeAt(1);
  const statuses: TableStatus[] = ["EMPTY", "OCCUPIED", "OCCUPIED", "CLEANING", "RESERVED", "OCCUPIED"];
  const tables: TableInfo[] = [];
  const cols = 4;
  const rows = 3;
  for (let i = 0; i < cols * rows; i++) {
    const status = statuses[(i + seed) % statuses.length];
    tables.push({
      id: `t${i + 1}`,
      number: i + 1,
      seats: [2, 4, 4, 6][i % 4],
      status,
      remainingMinutes: status === "OCCUPIED" ? 5 + ((i * 7 + seed) % 40) : undefined,
      x: i % cols,
      y: Math.floor(i / cols),
    });
  }
  return tables;
};

export const statusLabel: Record<TableStatus, string> = {
  EMPTY: "비어있음",
  OCCUPIED: "사용중",
  CLEANING: "청소중",
  RESERVED: "예약",
};

export const hourlyVisitors = [
  { hour: "11", value: 8 },
  { hour: "12", value: 24 },
  { hour: "13", value: 31 },
  { hour: "14", value: 12 },
  { hour: "15", value: 6 },
  { hour: "16", value: 9 },
  { hour: "17", value: 18 },
  { hour: "18", value: 35 },
  { hour: "19", value: 42 },
  { hour: "20", value: 38 },
  { hour: "21", value: 22 },
  { hour: "22", value: 11 },
];
