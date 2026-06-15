import ImageKit from "imagekit"

let _imagekit: InstanceType<typeof ImageKit> | null = null

export function isImageKitConfigured(): boolean {
  return !!(process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT)
}

export function getImageKit(): ImageKit | null {
  if (!isImageKitConfigured()) return null
  if (!_imagekit) {
    _imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    })
  }
  return _imagekit
}

export function getImageKitAuth(): { signature: string; expire: number; token: string } | null {
  const imagekit = getImageKit()
  if (!imagekit) return null
  return imagekit.getAuthenticationParameters()
}

export async function uploadToImageKit(file: Buffer, fileName: string, folder?: string) {
  const imagekit = getImageKit()
  if (!imagekit) throw new Error("ImageKit is not configured")
  return imagekit.upload({ file, fileName, folder: folder || "/products", useUniqueFileName: true })
}

export async function deleteFromImageKit(fileId: string) {
  const imagekit = getImageKit()
  if (!imagekit) throw new Error("ImageKit is not configured")
  return imagekit.deleteFile(fileId)
}
