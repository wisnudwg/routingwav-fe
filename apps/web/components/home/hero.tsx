"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

const slides = [1, 2, 3, 4, 5].map((n) => `/images/hero-${n.toString().padStart(2, "0")}.png`)

export function Hero() {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [q, setQ] = useState("")
  const [genre, setGenre] = useState("")

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000)
    return () => clearInterval(id)
  }, [])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (genre) params.set("genre", genre)
    router.push(`/talent?${params.toString()}`)
  }

  return (
    <section className="relative isolate overflow-hidden bg-brand-dark text-white md:h-[23rem]">
      {/* Background slides */}
      <AnimatePresence>
        <motion.div
          key={index}
          className="absolute inset-0 -z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <Image
            src={String(slides[index])}
            alt=""
            fill
            priority={index === 0}
            sizes="100vw"
            className="object-cover object-right"
          />
        </motion.div>
      </AnimatePresence>
      {/* Left-to-right dark overlay */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-dark from-35% via-brand-dark/70 to-transparent" />

      <div className="mx-auto flex h-full max-w-6xl flex-col justify-center px-4 py-16 md:py-0">
        <h1 className="font-heading text-3xl font-bold leading-tight md:text-4xl">
          Platform &amp; Marketplace
          <br />
          Produksi Musik <span className="text-rose">End-to-End</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm text-white/85">
          Keamanan Transaksi &amp; Pemerataan Akses Produksi Musik di Indonesia.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 flex w-full max-w-[30rem] flex-col gap-1 rounded-lg bg-white p-1.5 shadow-lg sm:flex-row sm:items-center"
        >
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari Mixing, Mastering, Produser..."
            className="border-0 text-brand-dark shadow-none focus-visible:ring-0"
          />
          <div className="hidden h-6 w-px bg-border sm:block" />
          <Input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Genre..."
            className="border-0 text-brand-dark shadow-none focus-visible:ring-0 sm:w-32"
          />
          <Button type="submit" variant="ghost" className="text-brand">
            Cari
          </Button>
          <Button type="submit">Mulai Cari</Button>
        </form>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 rounded-full bg-white/50 transition-all",
              i === index ? "w-6 bg-white" : "w-1.5"
            )}
          />
        ))}
      </div>
    </section>
  )
}