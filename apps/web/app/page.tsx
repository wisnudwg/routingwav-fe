import { Hero } from "@/components/home/hero"
import { TrustBar } from "@/components/home/trust-bar"
import { CategoryGrid } from "@/components/home/category-grid"

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <CategoryGrid />
    </main>
  )
}
