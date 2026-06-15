"use server"

import { isImageKitConfigured, getImageKit } from "@/lib/upload/imagekit"
import { requireRole } from "@/lib/auth/session"

export async function uploadFileAction(formData: FormData) {
  await requireRole("super_admin", "admin", "inventory_manager")

  const file = formData.get("file") as File | null
  if (!file) {
    return { success: false, message: "No file provided" }
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]
  if (!allowedTypes.includes(file.type)) {
    return { success: false, message: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG" }
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { success: false, message: "File too large. Maximum size is 10MB" }
  }

  if (!isImageKitConfigured()) {
    return { success: false, message: "Image upload is not configured" }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const imagekit = getImageKit()
    if (!imagekit) {
      return { success: false, message: "Image upload is not configured" }
    }
    const result = await imagekit.upload({
      file: buffer,
      fileName: file.name,
      folder: "/products",
      useUniqueFileName: true,
    })

    return {
      success: true,
      data: {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
        size: result.size,
      },
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Upload failed" }
  }
}

export async function deleteFileAction(fileId: string) {
  await requireRole("super_admin", "admin", "inventory_manager")

  if (!isImageKitConfigured()) {
    return { success: false, message: "Image upload is not configured" }
  }

  try {
    const imagekit = getImageKit()
    if (!imagekit) {
      return { success: false, message: "Image upload is not configured" }
    }
    await imagekit.deleteFile(fileId)
    return { success: true }
  } catch {
    return { success: false, message: "Failed to delete file" }
  }
}
