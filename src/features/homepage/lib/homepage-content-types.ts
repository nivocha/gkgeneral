import { z } from "zod"

export const HeroBannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  badge: z.string().optional(),
  image: z.string().optional(),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
  gradient: z.string().default("from-blue-900 to-slate-900"),
  bgGlow: z.string().optional(),
  iconColor: z.string().optional(),
  iconName: z.string().default("Factory"),
  spec1: z.string().optional(),
  spec2: z.string().optional(),
  spec3: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export const PromotionBannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
  badge: z.string().optional(),
  gradient: z.string().default("from-primary/10 to-primary/5"),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const TestimonialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  rating: z.number().int().min(1).max(5).default(5),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const SiteStatisticSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  iconName: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
})

export type HeroBannerInput = z.infer<typeof HeroBannerSchema>
export type PromotionBannerInput = z.infer<typeof PromotionBannerSchema>
export type TestimonialInput = z.infer<typeof TestimonialSchema>
export type SiteStatisticInput = z.infer<typeof SiteStatisticSchema>
