export function productStructuredData(product: {
  name: string
  description: string
  sku: string
  price: number
  currency: string
  image?: string
  url: string
  availability: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability:
        product.availability === "InStock"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: product.url,
    },
  }
}

export function categoryStructuredData(category: {
  name: string
  description: string
  url: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description,
    url: category.url,
  }
}

export function organizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GK General Supply",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://gk-supply.com",
    logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://gk-supply.com"}/logo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+255-XXX-XXX-XXX",
      contactType: "customer service",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "TZ",
    },
  }
}

export function breadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
