"use client"

import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateProfileAction, changePasswordAction } from "@/features/auth/actions"

type Props = {
  user: { name: string; email: string; phone: string | null; image: string | null }
}

function ProfileFormInner({ user }: Props) {
  const router = useRouter()
  const [_profileState, profileAction, profilePending] = useActionState(async (_prev: unknown, formData: FormData) => {
    await updateProfileAction(formData)
    toast.success("Profile updated")
    router.refresh()
    return null
  }, null)
  const [_pwState, pwAction, pwPending] = useActionState(async (_prev: unknown, formData: FormData) => {
    await changePasswordAction(formData)
    toast.success("Password changed")
    router.refresh()
    return null
  }, null)

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
        <CardContent>
          <form action={profileAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={user.name} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed here. Contact support.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={user.phone || ""} placeholder="+255 700 000 000" />
            </div>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form action={pwAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" name="currentPassword" type="password" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" required />
            </div>
            <Button type="submit" disabled={pwPending}>
              {pwPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Changing...</> : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function ProfileForm({ user }: Props) {
  return <ProfileFormInner user={user} />
}
