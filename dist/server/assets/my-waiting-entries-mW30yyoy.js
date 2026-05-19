const MY_WAITING_ENTRY_IDS_KEY = "seatnow.my-waiting-entry-ids.v1";
function getStoredWaitingEntryIds() {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(MY_WAITING_ENTRY_IDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}
function rememberWaitingEntry(entryId) {
  if (typeof window === "undefined") return;
  const nextIds = [entryId, ...getStoredWaitingEntryIds().filter((id) => id !== entryId)];
  window.localStorage.setItem(MY_WAITING_ENTRY_IDS_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new Event("seatnow-my-waiting-entries"));
}
function forgetWaitingEntry(entryId) {
  if (typeof window === "undefined") return;
  const nextIds = getStoredWaitingEntryIds().filter((id) => id !== entryId);
  window.localStorage.setItem(MY_WAITING_ENTRY_IDS_KEY, JSON.stringify(nextIds));
  window.dispatchEvent(new Event("seatnow-my-waiting-entries"));
}
export {
  forgetWaitingEntry as f,
  getStoredWaitingEntryIds as g,
  rememberWaitingEntry as r
};
