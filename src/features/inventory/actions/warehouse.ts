"use server"

import { requireRole } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { logAuditEvent } from "@/lib/logger/prisma"
import { revalidatePath } from "next/cache"
import { CreateWarehouseSchema, UpdateWarehouseSchema } from "@/features/inventory/schemas"
import { z } from "zod"

export async function createWarehouse(data: z.infer<typeof CreateWarehouseSchema>) {
  const user = await requireRole("super_admin", "admin")

  const validated = CreateWarehouseSchema.parse(data)

  const existing = await prisma.warehouse.findFirst({ where: { name: validated.name } })
  if (existing) {
    return { success: false, message: "Warehouse name already exists" }
  }

  const warehouse = await prisma.warehouse.create({ data: validated })

  await logAuditEvent({
    userId: user.id,
    action: "WAREHOUSE_CREATED",
    entity: "warehouse",
    entityId: warehouse.id,
    description: `Warehouse created: ${warehouse.name}`,
    metadata: { name: warehouse.name, location: warehouse.location },
  })

  revalidatePath("/admin/dashboard/warehouses")

  return {
    success: true,
    message: "Warehouse created successfully",
    data: { id: warehouse.id, name: warehouse.name },
  }
}

export async function updateWarehouse(data: z.infer<typeof UpdateWarehouseSchema>) {
  const user = await requireRole("super_admin", "admin")

  const validated = UpdateWarehouseSchema.parse(data)

  const existing = await prisma.warehouse.findFirst({
    where: { name: validated.name, id: { not: validated.id } },
  })
  if (existing) {
    return { success: false, message: "Warehouse name already exists" }
  }

  const warehouse = await prisma.warehouse.update({
    where: { id: validated.id },
    data: {
      name: validated.name,
      location: validated.location,
      isActive: validated.isActive,
    },
  })

  await logAuditEvent({
    userId: user.id,
    action: "WAREHOUSE_UPDATED",
    entity: "warehouse",
    entityId: warehouse.id,
    description: `Warehouse updated: ${warehouse.name}`,
    metadata: { name: warehouse.name, location: warehouse.location, isActive: warehouse.isActive },
  })

  revalidatePath("/admin/dashboard/warehouses")
  revalidatePath(`/admin/dashboard/warehouses/${warehouse.id}`)
  revalidatePath(`/admin/dashboard/warehouses/${warehouse.id}/edit`)

  return { success: true, message: "Warehouse updated successfully", data: { id: warehouse.id } }
}

export async function toggleWarehouseActive(id: string, isActive: boolean) {
  const user = await requireRole("super_admin", "admin")

  const warehouse = await prisma.warehouse.update({
    where: { id },
    data: { isActive },
  })

  await logAuditEvent({
    userId: user.id,
    action: "WAREHOUSE_UPDATED",
    entity: "warehouse",
    entityId: id,
    description: `Warehouse ${isActive ? "activated" : "deactivated"}: ${warehouse.name}`,
    metadata: { name: warehouse.name, isActive },
  })

  revalidatePath("/admin/dashboard/warehouses")
  revalidatePath(`/admin/dashboard/warehouses/${id}`)

  return { success: true, message: `Warehouse ${isActive ? "activated" : "deactivated"}` }
}

export async function getWarehouseById(id: string) {
  await requireRole("super_admin", "admin", "inventory_manager")

  const warehouse = await prisma.warehouse.findUnique({
    where: { id },
    include: {
      _count: { select: { inventories: true, movements: true } },
    },
  })

  if (!warehouse) return { success: false, message: "Warehouse not found" }

  return { success: true, data: warehouse }
}

export async function getWarehouses(params?: {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}) {
  await requireRole("super_admin", "admin", "inventory_manager")

  const page = Math.max(1, params?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, params?.pageSize ?? 20))
  const skip = (page - 1) * pageSize

  const where: Record<string, unknown> = {}
  if (params?.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { location: { contains: params.search, mode: "insensitive" } },
    ]
  }

  const orderBy: Record<string, string> = {}
  orderBy[params?.sortBy ?? "name"] = params?.sortOrder ?? "asc"

  const [items, total] = await Promise.all([
    prisma.warehouse.findMany({
      where: where as any,
      orderBy: orderBy as any,
      skip,
      take: pageSize,
    }),
    prisma.warehouse.count({ where: where as any }),
  ])

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export type WarehouseListResult = Awaited<ReturnType<typeof getWarehouses>>
