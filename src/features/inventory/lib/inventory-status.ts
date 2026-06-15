import type { InventoryMovementType } from "@/lib/prisma"

export const MOVEMENT_LABELS: Record<InventoryMovementType, string> = {
  STOCK_IN: "Stock In",
  STOCK_OUT: "Stock Out",
  ADJUSTMENT: "Adjustment",
  TRANSFER: "Transfer",
  RESERVED: "Reserved",
  RELEASED: "Released",
}

export const MOVEMENT_COLORS: Record<InventoryMovementType, string> = {
  STOCK_IN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  STOCK_OUT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ADJUSTMENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  TRANSFER: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  RESERVED: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  RELEASED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

export function computeAvailableStock(quantity: number, reservedQuantity: number): number {
  return quantity - reservedQuantity
}

export function isLowStock(available: number, minStockLevel: number): boolean {
  return available <= minStockLevel
}

export function isOutOfStock(available: number): boolean {
  return available <= 0
}
