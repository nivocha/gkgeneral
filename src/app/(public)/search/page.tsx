import type { Metadata } from "next"
import { Suspense } from "react"
import SearchPageContent from "@/features/search/components/search-content"

export const metadata: Metadata = {
  title: "Search Products",
  description: "Search our complete catalog of industrial equipment, generators, solar products, pumps, tools, and machinery.",
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container py-8"><p className="text-muted-foreground">Loading search...</p></div>}>
      <SearchPageContent />
    </Suspense>
  )
}
