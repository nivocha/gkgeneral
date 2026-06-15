"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { revalidatePath } from "next/cache"
import {
  AdjustInventorySchema,
  TransferInventorySchema,
  GetInventorySchema,
  GetMovementsSchema,
} from "@/features/inventory/schemas"
import { z } from "zod"

export async function adjustInventory(data: z.infer<typeof AdjustInventorySchema>) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const validated = AdjustInventorySchema.parse(data)

  const result = await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { id: validated.inventoryId },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    })

    if (!inventory) {
      throw new Error("Inventory record not found")
    }

    const finalQuantity =
      validated.type === "STOCK_IN"
        ? inventory.quantity + validated.quantity
        : validated.type === "STOCK_OUT"
          ? inventory.quantity - validated.quantity
          : validated.quantity

    if (finalQuantity < 0) {
      throw new Error("Insufficient stock")
    }

    if (validated.type === "STOCK_OUT" || validated.type === "ADJUSTMENT") {
      const available = inventory.quantity - inventory.reservedQuantity
      const netChange = validated.type === "STOCK_OUT" ? -validated.quantity : validated.quantity - inventory.quantity
      if (netChange < 0 && Math.abs(netChange) > available) {
        throw new Error(`Cannot reduce below reserved quantity. Available: ${available}`)
      }
    }

    await tx.inventory.update({
      where: { id: validated.inventoryId },
      data: { quantity: finalQuantity },
    })

    await tx.inventoryMovement.create({
      data: {
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        type: validated.type,
        quantity: validated.quantity,
        note: validated.note ?? null,
        reference: `adj_${Date.now()}`,
      },
    })

    return { inventory, finalQuantity }
  })

  await logAuditEvent({
    userId: user.id,
    action: "INVENTORY_ADJUSTED",
    entity: "inventory",
    entityId: validated.inventoryId,
    description: `Inventory ${validated.type.toLowerCase()}: ${result.inventory.product.name} (${result.inventory.product.sku}) at ${result.inventory.warehouse.name} — qty ${result.finalQuantity}`,
    metadata: {
      productId: result.inventory.productId,
      warehouseId: result.inventory.warehouseId,
      type: validated.type,
      quantity: validated.quantity,
      note: validated.note,
    },
  })

  revalidatePath("/admin/dashboard/inventory")
  revalidatePath(`/admin/dashboard/inventory/${validated.inventoryId}`)
  revalidatePath("/admin/dashboard/inventory/movements")

  return { success: true, message: `Stock ${validated.type.toLowerCase()} completed` }
}

export async function transferInventory(data: z.infer<typeof TransferInventorySchema>) {
  const user = await requireRole("super_admin", "admin", "inventory_manager")

  const validated = TransferInventorySchema.parse(data)

  const result = await prisma.$transaction(async (tx) => {
    const source = await tx.inventory.findUnique({
      where: { id: validated.inventoryId },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    })

    if (!source) throw new Error("Source inventory not found")

    const available = source.quantity - source.reservedQuantity
    if (validated.quantity > available) {
      throw new Error(`Insufficient available stock. Available: ${available}, Requested: ${validated.quantity}`)
    }

    if (source.warehouseId === validated.toWarehouseId) {
      throw new Error("Source and destination warehouses are the same")
    }

    const destWarehouse = await tx.warehouse.findUnique({
      where: { id: validated.toWarehouseId },
    })
    if (!destWarehouse || !destWarehouse.isActive) {
      throw new Error("Destination warehouse not found or inactive")
    }

    await tx.inventory.update({
      where: { id: source.id },
      data: { quantity: { decrement: validated.quantity } },
    })

    const existingDest = await tx.inventory.findUnique({
      where: {
        productId_warehouseId: {
          productId: source.productId,
          warehouseId: validated.toWarehouseId,
        },
      },
    })

    if (existingDest) {
      await tx.inventory.update({
        where: { id: existingDest.id },
        data: { quantity: { increment: validated.quantity } },
      })
    } else {
      await tx.inventory.create({
        data: {
          productId: source.productId,
          warehouseId: validated.toWarehouseId,
          quantity: validated.quantity,
          reservedQuantity: 0,
          minStockLevel: 5,
        },
      })
    }

    const ref = `trf_${Date.now()}`

    await tx.inventoryMovement.create({
      data: {
        productId: source.productId,
        warehouseId: source.warehouseId,
        type: "TRANSFER",
        quantity: -validated.quantity,
        reference: ref,
        note: validated.note ?? `Transfer to ${destWarehouse.name}`,
      },
    })

    await tx.inventoryMovement.create({
      data: {
        productId: source.productId,
        warehouseId: validated.toWarehouseId,
        type: "TRANSFER",
        quantity: validated.quantity,
        reference: ref,
        note: validated.note ?? `Transfer from ${source.warehouse.name}`,
      },
    })

    return { source, destWarehouse, quantity: validated.quantity }
  })

  await logAuditEvent({
    userId: user.id,
    action: "INVENTORY_TRANSFERRED",
    entity: "inventory",
    entityId: validated.inventoryId,
    description: `Inventory transferred: ${result.source.product.name} (${result.source.product.sku}) — ${result.source.warehouse.name} → ${result.destWarehouse.name} (${result.quantity} units)`,
    metadata: {
      productId: result.source.productId,
      fromWarehouseId: result.source.warehouseId,
      toWarehouseId: validated.toWarehouseId,
      quantity: result.quantity,
    },
  })

  revalidatePath("/admin/dashboard/inventory")
  revalidatePath(`/admin/dashboard/inventory/${validated.inventoryId}`)
  revalidatePath("/admin/dashboard/inventory/movements")

  return { success: true, message: "Transfer completed successfully" }
}

export async function getInventoryList(params?: z.infer<typeof GetInventorySchema>) {
  await requireRole("super_admin", "admin", "inventory_manager")

  const validated = GetInventorySchema.parse(params ?? {})

  const where: Record<string, unknown> = {}
  if (validated.search) {
    where.OR = [
      { product: { name: { contains: validated.search, mode: "insensitive" } } },
      { product: { sku: { contains: validated.search, mode: "insensitive" } } },
    ]
  }
  if (validated.warehouseId) {
    where.warehouseId = validated.warehouseId
  }

  const setNested = (obj: Record<string, unknown>, path: string, value: unknown) => {
    const keys = path.split(".")
    let current = obj
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] ??= {}
      current = current[keys[i]] as never
    }
    current[keys[keys.length - 1]] = value
  }
  const orderBy: Record<string, unknown> = {}
  const sortField = validated.sortBy ?? "product.name"
  setNested(orderBy, sortField, validated.sortOrder ?? "asc")

  const page = validated.page
  const pageSize = validated.pageSize
  const skip = (page - 1) * pageSize

  let items = await prisma.inventory.findMany({
    where: where as any,
    include: {
      product: { select: { id: true, name: true, sku: true, price: true, unit: true, isPublished: true } },
      warehouse: { select: { id: true, name: true } },
    },
    orderBy: orderBy as any,
    skip,
    take: pageSize,
  })

  if (validated.lowStock) {
    items = items.filter((i) => (i.quantity - i.reservedQuantity) <= i.minStockLevel)
  }

  const total = await prisma.inventory.count({ where: where as any })

  return {
    items: items.map((i) => ({
      ...i,
      product: { ...i.product, price: Number(i.product.price) },
    })),
    total: validated.lowStock ? items.length : total,
    page,
    pageSize,
    totalPages: Math.ceil((validated.lowStock ? items.length : total) / pageSize),
  }
}

export async function getInventoryById(id: string) {
  await requireRole("super_admin", "admin", "inventory_manager")

  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      product: {
        select: { id: true, name: true, sku: true, price: true, unit: true, isPublished: true, status: true },
      },
      warehouse: { select: { id: true, name: true, location: true } },
    },
  })

  if (!inventory) return { success: false, message: "Inventory not found" }

  const movements = await prisma.inventoryMovement.findMany({
    where: { productId: inventory.productId, warehouseId: inventory.warehouseId },
    include: {
      product: { select: { name: true } },
      warehouse: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const data = {
    id: inventory.id,
    productId: inventory.productId,
    warehouseId: inventory.warehouseId,
    quantity: inventory.quantity,
    reservedQuantity: inventory.reservedQuantity,
    minStockLevel: inventory.minStockLevel,
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
    product: { ...inventory.product, price: Number(inventory.product.price) },
    warehouse: inventory.warehouse,
    movements,
    availableQuantity: inventory.quantity - inventory.reservedQuantity,
  }

  return { success: true, data }
}

export async function getInventoryMovements(params?: z.infer<typeof GetMovementsSchema>) {
  await requireRole("super_admin", "admin", "inventory_manager")

  const validated = GetMovementsSchema.parse(params ?? {})

  const where: Record<string, unknown> = {}
  if (validated.search) {
    where.OR = [
      { product: { name: { contains: validated.search, mode: "insensitive" } } },
      { product: { sku: { contains: validated.search, mode: "insensitive" } } },
      { reference: { contains: validated.search, mode: "insensitive" } },
    ]
  }
  if (validated.type) {
    where.type = validated.type
  }
  if (validated.warehouseId) {
    where.warehouseId = validated.warehouseId
  }
  if (validated.fromDate || validated.toDate) {
    where.createdAt = {}
    if (validated.fromDate) (where.createdAt as never).gte = new Date(validated.fromDate)
    if (validated.toDate) (where.createdAt as never).lte = new Date(validated.toDate)
  }

  const orderBy: Record<string, string> = {}
  orderBy[validated.sortBy ?? "createdAt"] = validated.sortOrder ?? "desc"

  const page = validated.page
  const pageSize = validated.pageSize
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.inventoryMovement.findMany({
      where: where as any,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: orderBy as any,
      skip,
      take: pageSize,
    }),
    prisma.inventoryMovement.count({ where: where as any }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getInventoryAnalytics() {
  await requireRole("super_admin", "admin", "inventory_manager")

  const inventoryItems = await prisma.inventory.findMany({
    include: {
      product: { select: { id: true, name: true, price: true } },
    },
  })

  const activeWarehouses = await prisma.warehouse.count({ where: { isActive: true } })

  let totalStockValue = 0
  let lowStock = 0
  let outOfStock = 0

  for (const i of inventoryItems) {
    const price = i.product.price ? Number(i.product.price) : 0
    totalStockValue += price * i.quantity
    const available = i.quantity - i.reservedQuantity
    if (available <= i.minStockLevel) lowStock++
    if (available <= 0) outOfStock++
  }

  return {
    totalStockValue,
    totalSkus: inventoryItems.length,
    lowStock,
    outOfStock,
    activeWarehouses,
  }
}
