import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TestimonialData = {
  id: string
  name: string
  title: string | null
  company: string | null
  avatar: string | null
  content: string
  rating: number
}

export function TestimonialSection({ testimonials }: { testimonials: TestimonialData[] }) {
  if (testimonials.length === 0) return null

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold">What Our Clients Say</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Trusted by industrial clients across East Africa
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.id} className="border-primary/5">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < t.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-2 border-t">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    {(t.title || t.company) && (
                      <p className="text-xs text-muted-foreground">
                        {[t.title, t.company].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
