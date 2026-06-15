"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Trash2, MessageSquare, Eye, EyeOff } from "lucide-react"
import { markAsRead, addReplyNote, deleteContactSubmission } from "@/features/contact/actions/contact-actions"
import { toast } from "sonner"

type Submission = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  isRead: boolean
  replyNote: string | null
  createdAt: string
}

export default function ContactList({
  submissions,
  total,
  pages,
  currentPage,
}: {
  submissions: Submission[]
  total: number
  pages: number
  currentPage: number
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<Submission | null>(null)
  const [replyNote, setReplyNote] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)
  const [openModal, setOpenModal] = useState(false)

  const handleMarkRead = async (id: string) => {
    await markAsRead(id)
    router.refresh()
  }

  const handleReply = async () => {
    if (!selected || !replyNote.trim()) return
    setReplyLoading(true)
    try {
      await addReplyNote(selected.id, replyNote)
      toast.success("Reply note saved")
      setReplyNote("")
      setOpenModal(false)
      router.refresh()
    } catch {
      toast.error("Failed to save reply")
    } finally {
      setReplyLoading(false)
    }
  }

  const handleDelete = async (formData: FormData) => {
    await deleteContactSubmission(formData)
    toast.success("Submission deleted")
    router.refresh()
  }

  const openDetail = (s: Submission) => {
    setSelected(s)
    setReplyNote(s.replyNote ?? "")
    setOpenModal(true)
    if (!s.isRead) handleMarkRead(s.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contact Submissions</h1>
          <p className="text-muted-foreground mt-1">{total} submissions</p>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
              <div className="col-span-2">Name</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-3">Subject</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-center">Reply</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y">
              {submissions.map((s) => (
                <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center hover:bg-muted/30">
                  <div className="col-span-2 font-medium truncate">{s.name}</div>
                  <div className="col-span-2 text-muted-foreground truncate">{s.email}</div>
                  <div className="col-span-3 truncate">{s.subject}</div>
                  <div className="col-span-2 text-center">{s.isRead ? <Eye className="h-4 w-4 inline text-green-500" /> : <EyeOff className="h-4 w-4 inline text-muted-foreground" />}</div>
                  <div className="col-span-1 text-center">{s.replyNote ? <MessageSquare className="h-4 w-4 inline text-blue-500" /> : "\u2014"}</div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDetail(s)}><Mail className="h-4 w-4" /></Button>
                    <form action={handleDelete}><input type="hidden" name="id" value={s.id} /><Button variant="ghost" size="icon" type="submit"><Trash2 className="h-4 w-4" /></Button></form>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && <div className="px-4 py-12 text-center text-muted-foreground">No submissions</div>}
            </div>
          </div>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => router.push(`/admin/dashboard/contact?page=${p}`)}
            >
              {p}
            </Button>
          ))}
        </div>
      )}

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Contact Submission</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label>Name</Label><p className="font-medium">{selected.name}</p></div>
                <div><Label>Email</Label><p className="font-medium">{selected.email}</p></div>
                {selected.phone && <div><Label>Phone</Label><p className="font-medium">{selected.phone}</p></div>}
                <div><Label>Date</Label><p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p></div>
              </div>
              <div><Label>Subject</Label><p className="font-medium">{selected.subject}</p></div>
              <div><Label>Message</Label><p className="text-sm whitespace-pre-wrap bg-muted rounded p-3">{selected.message}</p></div>
              <div className="space-y-2">
                <Label>Reply Note</Label>
                <Textarea value={replyNote} onChange={(e) => setReplyNote(e.target.value)} placeholder="Enter your reply note..." />
                <Button onClick={handleReply} disabled={replyLoading || !replyNote.trim()}>
                  {replyLoading ? "Saving..." : "Save Reply Note"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
