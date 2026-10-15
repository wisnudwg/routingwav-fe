import Image from "next/image"
import { FileText, PenLine, Shield, ShieldCheck } from "lucide-react"

const items = [
  { icon: Shield, label: "100% Escrow Aman" },
  { icon: PenLine, label: "Watermark Preview" },
  { icon: ShieldCheck, label: "Kurasi Talent Terbaik" },
  { icon: FileText, label: "Kontrak Hukum Otomatis" },
]

const partners = ["partner-1.svg", "partner-2.svg", "partner-3.svg", "partner-4.svg"]

export function TrustBar() {
  return (
    <section className="bg-brand text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
        <div className="leading-tight">
          <p className="font-heading text-base font-semibold">Trust and Safety</p>
          <p className="text-[11px] text-white/60">Lencana Kepercayaan</p>
        </div>

        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {items.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="size-4 text-white/80" aria-hidden />
              {label}
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-6 opacity-40 grayscale lg:flex">
          {partners.map((p) => (
            <Image key={p} src={`/images/partners/${p}`} alt="" width={64} height={24} />
          ))}
        </div>
      </div>
    </section>
  )
}