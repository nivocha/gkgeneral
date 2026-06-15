"use client"

import { useQuery } from "@tanstack/react-query"
import { getCategories, getHeaderCategories, getPublicProducts, getProductBySlug } from "../actions/prisma"

export function useProducts(options: {
  search?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ["products", options],
    queryFn: () => getPublicProducts(options),
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug(slug),
    enabled: !!slug,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  })
}

export function useHeaderCategories() {
  return useQuery({
    queryKey: ["header-categories"],
    queryFn: () => getHeaderCategories(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })
}
