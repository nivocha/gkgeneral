import type { Metadata } from "next"
import { ProductsPageContent } from "./content"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our complete catalog of industrial equipment, generators, solar products, pumps, tools, and machinery.",
}

export const dynamic = "force-dynamic"

export default function ProductsPage() {
  return <ProductsPageContent />
}
