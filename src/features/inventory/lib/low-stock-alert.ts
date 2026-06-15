import { prisma } from "@/lib/prisma"

type LowStockItem = {
  productId: string
  productName: string
  productSku: string
  warehouseId: string
  warehouseName: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minStockLevel: number
}

export async function checkLowStockAlerts(): Promise<LowStockItem[]> {
  const inventories = await prisma.inventory.findMany({
    where: { product: { isPublished: true } },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      warehouse: { select: { id: true, name: true } },
    },
  })

  const lowStock: LowStockItem[] = []

  for (const inv of inventories) {
    const available = inv.quantity - inv.reservedQuantity
    if (available <= inv.minStockLevel) {
      lowStock.push({
        productId: inv.product.id,
        productName: inv.product.name,
        productSku: inv.product.sku,
        warehouseId: inv.warehouse.id,
        warehouseName: inv.warehouse.name,
        quantity: inv.quantity,
        reservedQuantity: inv.reservedQuantity,
        availableQuantity: available,
        minStockLevel: inv.minStockLevel,
      })
    }
  }

  return lowStock
}

export async function createLowStockNotifications(): Promise<number> {
  const lowStockItems = await checkLowStockAlerts()

  if (lowStockItems.length === 0) return 0

  const admins = await prisma.user.findMany({
    where: { role: { in: ["super_admin", "admin", "inventory_manager"] } },
    select: { id: true },
  })

  let created = 0
  for (const admin of admins) {
    for (const item of lowStockItems) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          title: "Low Stock Alert",
          message: `${item.productName} (${item.productSku}) at ${item.warehouseName}: ${item.availableQuantity} available, min ${item.minStockLevel}`,
          type: "warning",
          link: `/admin/dashboard/inventory?search=${item.productSku}`,
        },
      })
      created++
    }
  }

  return created
}
