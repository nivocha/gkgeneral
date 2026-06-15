import { notFound } from "next/navigation"
import { getTestimonial } from "@/features/homepage/actions/manage-testimonials"
import TestimonialForm from "../../testimonial-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "Edit Testimonial | CMS" }

type Props = { params: Promise<{ id: string }> }

export default async function EditTestimonialPage({ params }: Props) {
  const { id } = await params
  const testimonial = await getTestimonial(id)
  if (!testimonial) notFound()
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Testimonial</h1>
      <TestimonialForm initial={testimonial} />
    </div>
  )
}
