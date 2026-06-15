import { requireAuth } from "@/lib/auth/session"
import { prisma } from "@/lib/prisma"
import { ProfileForm } from "./profile-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Profile | Account" }

export default async function ProfilePage() {
  const user = await requireAuth()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true, image: true },
  })
  if (!dbUser) throw new Error("User not found")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>
      <ProfileForm user={dbUser} />
    </div>
  )
}
