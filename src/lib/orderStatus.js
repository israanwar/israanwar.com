// Status flow: PENDING_PAYMENT → WAITING_VERIFICATION → PAID / REJECTED / CANCELLED
export const ORDER_STATUS = {
  PENDING_PAYMENT: "pending_payment",
  WAITING_VERIFICATION: "waiting_verification",
  PAID: "paid",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
};
