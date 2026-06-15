import type { PrismaTransactionClient } from "@/lib/prisma"

export async function commitInventoryForOrder(
  tx: PrismaTransactionClient,
  orderId: string,
  orderNumber: string
): Promise<void> {
  const orderItems = await tx.orderItem.findMany({ where: { orderId } })

  for (const item of orderItems) {
    const invs = await tx.inventory.findMany({
      where: { productId: item.productId, reservedQuantity: { gt: 0 } },
      orderBy: { reservedQuantity: "desc" },
    })

    let toRelease = item.quantity
    for (const inv of invs) {
      if (toRelease <= 0) break
      const release = Math.min(toRelease, inv.reservedQuantity)
      await tx.inventory.update({
        where: { id: inv.id },
        data: { reservedQuantity: { decrement: release } },
      })
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: inv.warehouseId,
          type: "STOCK_OUT",
          quantity: release,
          reference: orderNumber,
          note: "Stock committed on payment",
        },
      })
      toRelease -= release
    }
  }
}

export async function releaseInventoryForOrder(
  tx: PrismaTransactionClient,
  orderId: string,
  orderNumber: string
): Promise<void> {
  const orderItems = await tx.orderItem.findMany({ where: { orderId } })

  for (const item of orderItems) {
    const invs = await tx.inventory.findMany({
      where: { productId: item.productId },
      orderBy: { quantity: "asc" },
    })

    let toRestore = item.quantity
    for (const inv of invs) {
      if (toRestore <= 0) break
      const release = Math.min(toRestore, inv.reservedQuantity)
      await tx.inventory.update({
        where: { id: inv.id },
        data: {
          quantity: { increment: toRestore },
          reservedQuantity: { decrement: release },
        },
      })
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: inv.warehouseId,
          type: "RELEASED",
          quantity: toRestore,
          reference: orderNumber,
          note: "Stock released",
        },
      })
      toRestore = 0
    }
  }
}
