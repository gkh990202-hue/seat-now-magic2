export const WAITING_NOTIFICATION_EVENT = "entry-called";

export interface WaitingNotificationPayload {
  entryId: string;
  restaurantName: string;
  message: string;
  sentAt: string;
}

export function getWaitingNotificationChannelName(entryId: string) {
  return `waiting-notification:${entryId}`;
}
