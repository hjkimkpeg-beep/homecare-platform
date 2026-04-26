export const ORDER_STATUSES = [
  "requested",
  "paid",
  "pending_assignment",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "inspection_pending",
  "inspection_approved",
  "completed",
  "cancelled",
  "as_requested",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}
