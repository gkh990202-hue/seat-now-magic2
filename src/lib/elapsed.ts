import { useEffect, useState } from "react";

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatElapsed(fromIso: string | null | undefined, now: number): string {
  if (!fromIso) return "";
  const start = new Date(fromIso).getTime();
  if (Number.isNaN(start)) return "";
  const diffMin = Math.max(0, Math.floor((now - start) / 60_000));
  if (diffMin < 60) return `${diffMin}분 이용중`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m === 0 ? `${h}시간 이용중` : `${h}시간 ${m}분 이용중`;
}
