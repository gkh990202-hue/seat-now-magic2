import type { TableStatus } from "@/lib/mock-data";

const colorMap: Record<TableStatus, string> = {
  EMPTY: "text-status-empty",
  OCCUPIED: "text-status-occupied",
  CLEANING: "text-status-cleaning",
  RESERVED: "text-status-reserved",
};

export function StatusDot({ status, pulse = false }: { status: TableStatus; pulse?: boolean }) {
  return (
    <span className={`relative inline-flex h-2 w-2 ${colorMap[status]}`}>
      <span className={`absolute inset-0 rounded-full bg-current ${pulse ? "pulse-dot" : ""}`} />
      <span className="relative inline-block h-2 w-2 rounded-full bg-current" />
    </span>
  );
}
