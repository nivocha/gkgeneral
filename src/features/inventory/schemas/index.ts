import { z } from "zod"

export const CreateWarehouseSchema = z.object({
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().min(1, "Location is required"),
})

export type CreateWarehouseInput = z.infer<typeof CreateWarehouseSchema>

export const UpdateWarehouseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Warehouse name is required"),
  location: z.string().min(1, "Location is required"),
  isActive: z.boolean(),
})

export type UpdateWarehouseInput = z.infer<typeof UpdateWarehouseSchema>

export const GetWarehousesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export type GetWarehousesInput = z.infer<typeof GetWarehousesSchema>

export const AdjustInventorySchema = z.object({
  inventoryId: z.string().min(1, "Inventory ID is required"),
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Quantity must be positive"),
  note: z.string().optional(),
})

export type AdjustInventoryInput = z.infer<typeof AdjustInventorySchema>

export const TransferInventorySchema = z.object({
  inventoryId: z.string().min(1, "Inventory ID is required"),
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  note: z.string().optional(),
})

export type TransferInventoryInput = z.infer<typeof TransferInventorySchema>

export const GetInventorySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  warehouseId: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.string().default("product.name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
})

export type GetInventoryInput = z.infer<typeof GetInventorySchema>

export const GetMovementsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  search: z.string().optional(),
  type: z.string().optional(),
  warehouseId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export type GetMovementsInput = z.infer<typeof GetMovementsSchema>
