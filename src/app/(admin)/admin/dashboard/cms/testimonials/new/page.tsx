import TestimonialForm from "../testimonial-form"

export const dynamic = "force-dynamic"
export const metadata = { title: "New Testimonial | CMS" }

export default function NewTestimonialPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Testimonial</h1>
      <TestimonialForm />
    </div>
  )
}
