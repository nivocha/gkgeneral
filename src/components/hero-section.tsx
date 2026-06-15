"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { HeroSlide } from "@/lib/homepage"

export function HeroSection({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (slides.length < 2) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (slides.length === 0) return null

  const slide = slides[current]

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={`${s.slug}-${i}`}
          className={cn(
            "relative w-full transition-opacity duration-500 ease-in-out",
            i === current ? "block" : "hidden"
          )}
        >
          {/* Image */}
          <div className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[75vh]">
            {s.image ? (
              <Image
                src={s.image}
                alt={s.name}
                fill
                className="object-cover"
                priority={i === 0}
              />
            ) : (
              <div className={cn("w-full h-full bg-gradient-to-br", s.gradient)} />
            )}
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
          </div>

          {/* Content overlay */}
          <div className="absolute inset-0 flex items-end">
            <div className="container pb-8 sm:pb-12 lg:pb-16">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={s.badge === "New" ? "success" : "warning"}>
                    {s.badge}
                  </Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {s.brand}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight mb-3">
                  {s.name}
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl leading-relaxed mb-4">
                  {s.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg">
                    <Link href={`/products/${s.slug}`}>Shop Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/products">Browse All</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background/80 shadow-md hover:bg-background transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-background/80 shadow-md hover:bg-background transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={cn(
                "rounded-full transition-all duration-300",
                idx === current
                  ? "w-6 sm:w-8 h-2 sm:h-2.5 bg-primary"
                  : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-foreground/30 hover:bg-foreground/50"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
