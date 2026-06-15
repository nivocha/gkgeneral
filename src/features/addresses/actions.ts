"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth/session"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(2, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("Tanzania"),
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>

export async function getAddresses() {
  try {
    const user = await requireAuth()
    return prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })
  } catch {
    return []
  }
}

export async function createAddress(data: AddressInput) {
  const user = await requireAuth()
  const validated = addressSchema.parse(data)

  const result = await prisma.$transaction(async (tx) => {
    if (validated.isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
    }
    return tx.address.create({
      data: { ...validated, userId: user.id },
    })
  })

  revalidatePath("/account/addresses")
  return { success: true, data: result }
}

export async function updateAddress(id: string, data: AddressInput) {
  const user = await requireAuth()
  const validated = addressSchema.parse(data)

  const existing = await prisma.address.findFirst({ where: { id, userId: user.id } })
  if (!existing) return { success: false, message: "Address not found" }

  await prisma.$transaction(async (tx) => {
    if (validated.isDefault) {
      await tx.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      })
    }
    await tx.address.update({ where: { id }, data: validated })
  })

  revalidatePath("/account/addresses")
  return { success: true }
}

export async function deleteAddress(id: string) {
  const user = await requireAuth()
  await prisma.address.deleteMany({ where: { id, userId: user.id } })
  revalidatePath("/account/addresses")
  return { success: true }
}

export async function setDefaultAddress(id: string) {
  const user = await requireAuth()
  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
    await tx.address.update({ where: { id, userId: user.id }, data: { isDefault: true } })
  })
  revalidatePath("/account/addresses")
  return { success: true }
}
