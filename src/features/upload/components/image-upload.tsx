"use client"

import { useRef, useState, useCallback } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadFileAction } from "@/features/upload/actions"

interface ImageUploadProps {
  onUploadComplete: (url: string, fileId: string) => void
  multiple?: boolean
}

export function ImageUpload({ onUploadComplete, multiple }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadFileAction(formData)
      if (result.success && result.data) {
        onUploadComplete(result.data.url, result.data.fileId)
        setPreview(null)
      } else {
        setError(result.message || "Upload failed")
        setPreview(null)
      }
    } catch {
      setError("Upload failed")
      setPreview(null)
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }, [onUploadComplete])

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const file = e.dataTransfer.files?.[0]
          if (file) {
            const dt = new DataTransfer()
            dt.items.add(file)
            if (inputRef.current) {
              inputRef.current.files = dt.files
              inputRef.current.dispatchEvent(new Event("change", { bubbles: true }))
            }
          }
        }}
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-32 rounded" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click or drag to upload
            </p>
            <p className="text-xs text-muted-foreground">
              JPEG, PNG, WebP, GIF, SVG up to 10MB
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
