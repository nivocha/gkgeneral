import type { Metadata } from "next"
import { ProductsPageContent } from "./content"

export const metadata: Metadata = {
  title: "Products",
  description: "Browse our complete catalog of industrial equipment, generators, solar products, pumps, tools, and machinery.",
}

export const revalidate = 60

export default function ProductsPage() {
  return <ProductsPageContent />
}
