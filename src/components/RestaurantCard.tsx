import { Link } from "@tanstack/react-router";
import { Star, Users, Clock } from "lucide-react";
import type { Restaurant } from "@/lib/mock-data";

const busyTone = {
  low: { label: "여유", className: "bg-status-empty/15 text-status-empty" },
  medium: { label: "보통", className: "bg-status-cleaning/15 text-status-cleaning" },
  high: { label: "혼잡", className: "bg-status-occupied/15 text-status-occupied" },
} as const;

export function RestaurantCard({ r }: { r: Restaurant }) {
  const tone = busyTone[r.busyLevel];
  return (
    <Link
      to="/store/$storeId"
      params={{ storeId: r.id }}
      className="group block fade-in-up"
    >
      <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-all active:scale-[0.99] hover:border-primary/40">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface-elevated text-4xl">
          {r.image}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold">{r.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.className}`}>
              {tone.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {r.category} · {r.address}
          </p>
          <div className="mt-2.5 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-foreground/90">
              <Star className="h-3 w-3 fill-status-cleaning text-status-cleaning" />
              {r.rating}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              잔여 {r.emptyCount}/{r.totalTables}
            </span>
            {r.waitingCount > 0 ? (
              <span className="flex items-center gap-1 text-status-occupied">
                <Clock className="h-3 w-3" />
                대기 {r.waitingCount}팀
              </span>
            ) : (
              <span className="flex items-center gap-1 text-status-empty">
                <Clock className="h-3 w-3" />
                바로 입장
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
