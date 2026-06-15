import { Bell, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNotifications, markAllNotificationsRead } from "@/features/notifications/actions"
import { MarkReadButton } from "./mark-read-button"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="h-4 w-4 mr-1" /> Mark All Read
            </Button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No notifications</h2>
          <p className="text-muted-foreground">You&apos;re all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={cn(!n.isRead && "border-primary/30 bg-primary/5")}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.message}</p>
                    </div>
                    {!n.isRead && (
                      <MarkReadButton id={n.id} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      n.type === "order" && "bg-blue-100 text-blue-700",
                      n.type === "stock" && "bg-amber-100 text-amber-700",
                      n.type === "payment" && "bg-green-100 text-green-700",
                      n.type === "info" && "bg-gray-100 text-gray-700",
                    )}>
                      {n.type}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
