const META_SEPARATOR = "__SEATNOW_WAITING__";
function encodeFallbackWaitingPhone(phone, seatingPreference, preferredTableId, customerName) {
  return `${phone}${META_SEPARATOR}${seatingPreference}:${preferredTableId ?? ""}:${encodeURIComponent(customerName ?? "")}`;
}
function normalizeWaitingPreference(entry) {
  const [phone, meta] = entry.phone.split(META_SEPARATOR);
  if (meta) {
    const [preference, preferredTableId, customerName] = meta.split(":");
    return {
      phone,
      seating_preference: preference === "SPECIFIC" ? "SPECIFIC" : "ANY",
      preferred_table_id: preferredTableId || null,
      customer_name: customerName ? decodeURIComponent(customerName) : null
    };
  }
  return {
    phone: entry.phone,
    seating_preference: entry.seating_preference === "SPECIFIC" ? "SPECIFIC" : "ANY",
    preferred_table_id: entry.preferred_table_id ?? null,
    customer_name: null
  };
}
function isWaitingPreferenceSchemaError(error) {
  const message = error?.message ?? "";
  return message.includes("seating_preference") || message.includes("preferred_table_id") || message.includes("schema cache");
}
export {
  encodeFallbackWaitingPhone as e,
  isWaitingPreferenceSchemaError as i,
  normalizeWaitingPreference as n
};
