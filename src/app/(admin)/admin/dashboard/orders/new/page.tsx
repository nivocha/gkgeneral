import { requireRole } from "@/lib/auth/session"
import AdminCreateOrderPage from "./client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Create Order | Admin",
}

export default async function Page() {
  await requireRole("super_admin", "admin", "sales_manager")
  return <AdminCreateOrderPage />
}
