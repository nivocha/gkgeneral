import { prisma } from "@/lib/prisma"

export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoleRecords = await prisma.userRole.findMany({
    where: { userId },
    select: { roleId: true },
  })

  if (userRoleRecords.length === 0) return []

  const roleIds = userRoleRecords.map((r) => r.roleId)

  const permRecords = await prisma.rolePermission.findMany({
    where: { roleId: { in: roleIds } },
    include: { permission: { select: { name: true } } },
  })

  return permRecords.map((p) => p.permission.name)
}

export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)
  return userPerms.includes(permissionName)
}

export async function hasAnyPermission(userId: string, ...permNames: string[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)
  return permNames.some((p) => userPerms.includes(p))
}

export async function hasAllPermissions(userId: string, ...permNames: string[]): Promise<boolean> {
  const userPerms = await getUserPermissions(userId)
  return permNames.every((p) => userPerms.includes(p))
}
