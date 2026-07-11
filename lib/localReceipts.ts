export const LOCAL_RECEIPT_STORAGE_KEY = "loyz_local_receipts";

export interface LocalReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface LocalReceipt {
  id: string;
  cartId: string;
  tx_ref: string;
  createdAt: string;
  status: string;
  total: number;
  deliveryFee: number;
  items: LocalReceiptItem[];
  customerName: string;
  contact: string;
  deliveryMethod: string;
  deliveryAddress: string;
  receiptUrl?: string;
  linked?: boolean;
}

function safeParseLocalReceipts(value: string | null): LocalReceipt[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      linked: Boolean(item.linked),
    })) as LocalReceipt[];
  } catch (err) {
    console.error("Failed to parse local receipts:", err);
    return [];
  }
}

export function loadLocalReceipts(): LocalReceipt[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOCAL_RECEIPT_STORAGE_KEY);
  return safeParseLocalReceipts(raw);
}

export function saveLocalReceipts(receipts: LocalReceipt[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_RECEIPT_STORAGE_KEY, JSON.stringify(receipts));
  } catch (err) {
    console.error("Failed to save local receipts:", err);
  }
}

export function addOrUpdateLocalReceipt(receipt: LocalReceipt): void {
  if (typeof window === "undefined") return;
  const receipts = loadLocalReceipts();
  const existingIndex = receipts.findIndex((item) => item.cartId === receipt.cartId);
  if (existingIndex >= 0) {
    receipts[existingIndex] = {
      ...receipts[existingIndex],
      ...receipt,
      linked: receipts[existingIndex].linked || receipt.linked || false,
    };
  } else {
    receipts.unshift(receipt);
  }
  saveLocalReceipts(receipts);
}

export function updateLocalReceipt(cartId: string, patch: Partial<LocalReceipt>): void {
  if (typeof window === "undefined") return;
  const receipts = loadLocalReceipts();
  const idx = receipts.findIndex((item) => item.cartId === cartId);
  if (idx < 0) return;
  receipts[idx] = {
    ...receipts[idx],
    ...patch,
  };
  saveLocalReceipts(receipts);
}

export function markLocalReceiptsLinked(cartIds: string[]): void {
  if (typeof window === "undefined") return;
  const receipts = loadLocalReceipts();
  const updated = receipts.map((receipt) =>
    cartIds.includes(receipt.cartId) ? { ...receipt, linked: true } : receipt
  );
  saveLocalReceipts(updated);
}

export function getUnlinkedReceiptIds(): string[] {
  return loadLocalReceipts().filter((receipt) => !receipt.linked).map((receipt) => receipt.cartId);
}
