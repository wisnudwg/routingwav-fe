import Image from "next/image"
import Link from "next/link"

const categories = [
  { slug: "produce", label: "Produce", image: "/images/produce.png" },
  { slug: "session-player", label: "Session Player", image: "/images/session-player.png" },
  { slug: "mixing", label: "Mixing", image: "/images/mixing.png" },
  { slug: "mastering", label: "Mastering", image: "/images/mastering.png" },
]

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/talent?kategori=${c.slug}`}
            className="group relative aspect-[16/10] overflow-hidden rounded-xl"
          >
            <Image
              src={c.image}
              alt=""
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="h-5 w-1 bg-rose" aria-hidden />
              <span className="font-heading text-lg font-extrabold uppercase tracking-wide text-white md:text-2xl">
                {c.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}