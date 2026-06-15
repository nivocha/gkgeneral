"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Plus, Trash2, ArrowUp, ArrowDown, GripVertical,
  Upload, Link, Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ImageUpload } from "@/features/upload/components/image-upload"

const statusOptions = ["Draft", "Active", "Archived", "OutOfStock"] as const

const productFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  warranty: z.string().optional(),
  minOrderQuantity: z.number().min(1),
  maxOrderQuantity: z.number().optional(),
  status: z.enum(statusOptions),
  isFeatured: z.boolean(),
  price: z.number().positive().optional().or(z.literal("")),
  comparePrice: z.number().optional().or(z.literal("")),
  costPrice: z.number().optional().or(z.literal("")),
  currency: z.string(),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
})

type ProductFormValues = z.input<typeof productFormSchema>

interface VariantItem {
  id?: string
  name: string
  sku: string
  price: string
  costPrice: string
  attributes: string
  isActive: boolean
  sortOrder: number
}

interface SpecItem {
  id?: string
  label: string
  value: string
  sortOrder: number
}

interface DownloadItem {
  id?: string
  name: string
  url: string
  fileSize: string
}

interface ImageItem {
  id: string
  url: string
  alt: string | null
  isPrimary: boolean
  sortOrder: number
}

interface Props {
  initialData?: {
    id: string
    name: string
    slug: string
    shortDescription: string | null
    description: string | null
    categoryId: string | null
    brandId: string | null
    sku: string
    barcode: string | null
    unit: string
    weight: string | null
    dimensions: string | null
    material: string | null
    warranty: string | null
    minOrderQuantity: number
    maxOrderQuantity: number | null
    status: string
    isFeatured: boolean
    isPublished: boolean
    price: number | null
    comparePrice: number | null
    costPrice: number | null
    currency: string
    tags: string[]
    seoTitle: string | null
    seoDescription: string | null
    variants: VariantItem[]
    specifications: SpecItem[]
    downloads: DownloadItem[]
    images: ImageItem[]
  }
  categories: { id: string; name: string; slug: string }[]
  brands: { id: string; name: string; slug: string; logo: string | null }[]
}

export function ProductForm({ initialData, categories, brands }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const isEdit = !!initialData

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          shortDescription: initialData.shortDescription || "",
          description: initialData.description || "",
          categoryId: initialData.categoryId || "",
          brandId: initialData.brandId || "",
          sku: initialData.sku,
          barcode: initialData.barcode || "",
          unit: initialData.unit,
          weight: initialData.weight || "",
          dimensions: initialData.dimensions || "",
          material: initialData.material || "",
          warranty: initialData.warranty || "",
          minOrderQuantity: initialData.minOrderQuantity,
          maxOrderQuantity: initialData.maxOrderQuantity ?? undefined,
          status: initialData.status as "Draft" | "Active" | "Archived" | "OutOfStock",
          isFeatured: initialData.isFeatured,
          price: initialData.price ?? undefined,
          comparePrice: initialData.comparePrice ?? undefined,
          costPrice: initialData.costPrice ?? undefined,
          currency: initialData.currency,
          tags: initialData.tags.join(", "),
          seoTitle: initialData.seoTitle || initialData.name,
          seoDescription: initialData.seoDescription || initialData.shortDescription || undefined,
        }
      : {
          name: "",
          shortDescription: "",
          description: "",
          categoryId: "",
          brandId: "",
          sku: "",
          barcode: "",
          unit: "piece",
          weight: "",
          dimensions: "",
          material: "",
          warranty: "",
          minOrderQuantity: 1,
          maxOrderQuantity: undefined,
          status: "Draft",
          isFeatured: false,
          price: undefined,
          comparePrice: undefined,
          costPrice: undefined,
          currency: "TZS",
          tags: "",
          seoTitle: "",
          seoDescription: "",
        },
  })

  const [variants, setVariants] = useState<VariantItem[]>(
    initialData?.variants?.map((v) => ({
      ...v,
      price: String(v.price),
      costPrice: v.costPrice ? String(v.costPrice) : "",
    })) || [
      { name: "Standard", sku: "", price: "", costPrice: "", attributes: "", isActive: true, sortOrder: 0 },
    ]
  )

  const [specs, setSpecs] = useState<SpecItem[]>(
    initialData?.specifications?.map((s, i) => ({ ...s, sortOrder: i })) || []
  )

  const [downloads, setDownloads] = useState<DownloadItem[]>(
    initialData?.downloads || []
  )

  const [images, setImages] = useState<ImageItem[]>(initialData?.images || [])

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { name: "", sku: "", price: "", costPrice: "", attributes: "", isActive: true, sortOrder: prev.length },
    ])
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const updateVariant = (index: number, field: keyof VariantItem, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    )
  }

  const addSpec = () => {
    setSpecs((prev) => [...prev, { label: "", value: "", sortOrder: prev.length }])
  }

  const removeSpec = (index: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  const updateSpec = (index: number, field: keyof SpecItem, value: string) => {
    setSpecs((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    )
  }

  const addDownload = () => {
    setDownloads((prev) => [...prev, { name: "", url: "", fileSize: "" }])
  }

  const removeDownload = (index: number) => {
    setDownloads((prev) => prev.filter((_, i) => i !== index))
  }

  const updateDownload = (index: number, field: keyof DownloadItem, value: string) => {
    setDownloads((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  const handleImageUrl = async () => {
    const url = prompt("Enter image URL:")
    if (!url) return
    try {
      const { uploadProductImage } = await import("@/features/products/actions/prisma")
      if (!initialData?.id) {
        toast.error("Save the product first before adding images")
        return
      }
      const result = await uploadProductImage(initialData.id, { url })
      if (result.success) {
        toast.success("Image added")
        router.refresh()
      }
    } catch {
      toast.error("Failed to add image")
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    const { setPrimaryImage } = await import("@/features/products/actions/prisma")
    await setPrimaryImage(imageId)
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === imageId }))
    )
    toast.success("Primary image updated")
  }

  const handleDeleteImage = async (imageId: string) => {
    const { deleteProductImage } = await import("@/features/products/actions/prisma")
    const result = await deleteProductImage(imageId)
    if (result.success) {
      setImages((prev) => prev.filter((img) => img.id !== imageId))
      toast.success("Image deleted")
    }
  }

  const onSubmit = async (values: ProductFormValues) => {
    setSaving(true)
    try {
      const { createProduct, updateProduct } = await import("@/features/products/actions/prisma")

      const payload = {
        ...values,
        price: values.price || undefined,
        comparePrice: values.comparePrice || undefined,
        costPrice: values.costPrice || undefined,
        tags: values.tags
          ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        variants: variants
          .filter((v) => v.name && v.sku)
          .map((v, i) => ({
            ...v,
            price: parseFloat(v.price) || 0,
            costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
            sortOrder: i,
          })),
        specifications: specs
          .filter((s) => s.label && s.value)
          .map((s, i) => ({ ...s, sortOrder: i })),
        downloads: downloads
          .filter((d) => d.name && d.url)
          .map((d) => ({ ...d, fileSize: d.fileSize || undefined })),
      } satisfies Record<string, unknown>

      let result
      if (isEdit && initialData) {
        result = await updateProduct(initialData.id, payload as any)
      } else {
        result = await createProduct(payload as any)
      }

      if (result.success) {
        toast.success(isEdit ? "Product updated" : "Product created")
        router.push("/admin/dashboard/products")
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const watchName = watch("name")
  const watchStatus = watch("status")

  useEffect(() => {
    if (!isEdit && watchName && !initialData) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setValue("sku", slug.substring(0, 20).toUpperCase())
    }
  }, [watchName, isEdit, initialData, setValue])

  const seoSuggestion = watchName
    ? watchName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    : ""

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Product name, description, and categorization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input id="name" {...register("name")} placeholder="e.g. Industrial Diesel Generator 500kVA" />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" {...register("sku")} placeholder="Auto-generated if empty" />
            </div>
            <div>
              <Label htmlFor="barcode">Barcode / UPC</Label>
              <Input id="barcode" {...register("barcode")} placeholder="Optional" />
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                {...register("categoryId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="brandId">Brand</Label>
              <select
                id="brandId"
                {...register("brandId")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" {...register("unit")} placeholder="piece, kg, meter" />
            </div>
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input id="weight" {...register("weight")} placeholder="e.g. 1500 kg" />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensions</Label>
              <Input id="dimensions" {...register("dimensions")} placeholder="e.g. 200x100x150 cm" />
            </div>
            <div>
              <Label htmlFor="material">Material</Label>
              <Input id="material" {...register("material")} placeholder="e.g. Stainless Steel" />
            </div>
            <div>
              <Label htmlFor="warranty">Warranty</Label>
              <Input id="warranty" {...register("warranty")} placeholder="e.g. 2 Years" />
            </div>
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              {...register("shortDescription")}
              placeholder="Brief product summary for listings"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Detailed product description with features and benefits"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing & Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Inventory</CardTitle>
          <CardDescription>Price, stock levels, and currency settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="price">Selling Price</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} placeholder="0.00" />
              {errors.price && <p className="text-sm text-destructive mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <Label htmlFor="comparePrice">Compare at Price</Label>
              <Input id="comparePrice" type="number" step="0.01" {...register("comparePrice")} placeholder="0.00" />
            </div>
            <div>
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" type="number" step="0.01" {...register("costPrice")} placeholder="0.00" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                {...register("currency")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="TZS">TZS (Tanzanian Shilling)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="KES">KES (Kenyan Shilling)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrderQuantity">Min Order Quantity</Label>
              <Input id="minOrderQuantity" type="number" {...register("minOrderQuantity")} />
            </div>
            <div>
              <Label htmlFor="maxOrderQuantity">Max Order Quantity</Label>
              <Input id="maxOrderQuantity" type="number" {...register("maxOrderQuantity")} placeholder="Unlimited" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Visibility</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s === "OutOfStock" ? "Out of Stock" : s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("isFeatured")} className="h-4 w-4" />
                <span className="text-sm font-medium">Featured product</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Variants</CardTitle>
            <CardDescription>Different versions of this product (e.g. size, color, power)</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addVariant}>
            <Plus className="h-4 w-4 mr-1" /> Add Variant
          </Button>
        </CardHeader>
        <CardContent>
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No variants. Add one to offer multiple options.</p>
          ) : (
            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 p-3 border rounded-lg relative">
                  <div className="flex-1 grid sm:grid-cols-5 gap-2">
                    <div className="sm:col-span-2">
                      <Input
                        placeholder="Variant name"
                        value={v.name}
                        onChange={(e) => updateVariant(i, "name", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="SKU"
                        value={v.sku}
                        onChange={(e) => updateVariant(i, "sku", e.target.value)}
                        className="h-9 text-sm font-mono"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={v.price}
                        onChange={(e) => updateVariant(i, "price", e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive"
                        onClick={() => removeVariant(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Specifications</CardTitle>
            <CardDescription>Technical specifications for industrial products</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addSpec}>
            <Plus className="h-4 w-4 mr-1" /> Add Specification
          </Button>
        </CardHeader>
        <CardContent>
          {specs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specifications added yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Specification</TableHead>
                    <TableHead className="w-[50%]">Value</TableHead>
                    <TableHead className="w-[10%]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specs.map((s, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          placeholder="e.g. Power Output"
                          value={s.label}
                          onChange={(e) => updateSpec(i, "label", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="e.g. 500 kVA"
                          value={s.value}
                          onChange={(e) => updateSpec(i, "value", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeSpec(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Images</CardTitle>
            <CardDescription>Product photos and diagrams (ImageKit CDN)</CardDescription>
          </div>
          {isEdit && (
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleImageUrl}>
                <Link className="h-4 w-4 mr-1" /> Add URL
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isEdit && (
            <ImageUpload
              onUploadComplete={async (url, fileId) => {
                const { uploadProductImage } = await import("@/features/products/actions/prisma")
                if (!initialData?.id) return
                const result = await uploadProductImage(initialData.id, { url, alt: "" })
                if (result.success) {
                  toast.success("Image uploaded")
                  router.refresh()
                }
              }}
            />
          )}
          {!isEdit ? (
            <p className="text-sm text-muted-foreground">Save the product first to enable image uploads.</p>
          ) : images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images added. Upload above or add a URL.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group aspect-square rounded-lg border overflow-hidden bg-muted">
                  <img
                    src={img.url}
                    alt={img.alt || ""}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSetPrimary(img.id)}
                      title="Set as primary"
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteImage(img.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {img.isPrimary && (
                    <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0">Primary</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Downloads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Downloads</CardTitle>
            <CardDescription>PDF manuals, datasheets, and technical documents</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addDownload}>
            <Plus className="h-4 w-4 mr-1" /> Add Download
          </Button>
        </CardHeader>
        <CardContent>
          {downloads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No downloads added yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {downloads.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Input
                          placeholder="e.g. Product Manual PDF"
                          value={d.name}
                          onChange={(e) => updateDownload(i, "name", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="https://..."
                          value={d.url}
                          onChange={(e) => updateDownload(i, "url", e.target.value)}
                          className="h-9 text-sm font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="e.g. 2.5 MB"
                          value={d.fileSize}
                          onChange={(e) => updateDownload(i, "fileSize", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeDownload(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO */}
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Search engine optimization metadata</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="seoTitle">SEO Title</Label>
            <Input id="seoTitle" {...register("seoTitle")} placeholder={watchName || "Product title"} />
          </div>
          <div>
            <Label htmlFor="seoDescription">SEO Description</Label>
            <Textarea
              id="seoDescription"
              {...register("seoDescription")}
              placeholder="Meta description for search results"
              rows={2}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input id="tags" {...register("tags")} placeholder="Comma-separated: generator, diesel, industrial" />
            <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
          </div>
          <div>
            <Label>URL Slug</Label>
            <Input value={seoSuggestion} readOnly className="bg-muted text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  )
}
