export type SeatingPreference = "ANY" | "SPECIFIC";

const META_SEPARATOR = "__SEATNOW_WAITING__";

export interface WaitingPreferenceData {
  phone: string;
  seating_preference: SeatingPreference;
  preferred_table_id: string | null;
  customer_name: string | null;
}

export function encodeFallbackWaitingPhone(
  phone: string,
  seatingPreference: SeatingPreference,
  preferredTableId: string | null,
  customerName?: string,
) {
  return `${phone}${META_SEPARATOR}${seatingPreference}:${preferredTableId ?? ""}:${encodeURIComponent(customerName ?? "")}`;
}

export function normalizeWaitingPreference(entry: {
  phone: string;
  seating_preference?: string | null;
  preferred_table_id?: string | null;
}): WaitingPreferenceData {
  const [phone, meta] = entry.phone.split(META_SEPARATOR);
  if (meta) {
    const [preference, preferredTableId, customerName] = meta.split(":");
    return {
      phone,
      seating_preference: preference === "SPECIFIC" ? "SPECIFIC" : "ANY",
      preferred_table_id: preferredTableId || null,
      customer_name: customerName ? decodeURIComponent(customerName) : null,
    };
  }

  return {
    phone: entry.phone,
    seating_preference: entry.seating_preference === "SPECIFIC" ? "SPECIFIC" : "ANY",
    preferred_table_id: entry.preferred_table_id ?? null,
    customer_name: null,
  };
}

export function isWaitingPreferenceSchemaError(error: { message?: string } | null) {
  const message = error?.message ?? "";
  return (
    message.includes("seating_preference") ||
    message.includes("preferred_table_id") ||
    message.includes("schema cache")
  );
}
