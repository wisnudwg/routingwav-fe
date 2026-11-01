"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { ServerError } from "@/components/auth/server-error"
import { ApiError } from "@/lib/api"
import { useSession } from "@/lib/auth"
import { formatBytes, formatDateTime } from "@/lib/format"
import { DOC_SPECS, ID_LABEL, formatId, type DocKind, type IdField, type KycSummary } from "@/lib/kyc"
import { revealIdentity, viewDocument } from "@/lib/kyc-api"
import { can } from "@/lib/permissions"
import { StepUpPrompt } from "./step-up-prompt"

type Target = { kind: "field"; field: IdField } | { kind: "doc"; doc: DocKind; id: string }
type Viewing = { kind: DocKind; url: string; contentType: string }

const AUTO_HIDE_MS = 60_000 // revealed values and open documents hide again after a minute

export function IdentitySummary({ summary }: { summary: KycSummary }) {
  const session = useSession()
  const canReveal = !!session && can(session, "identity:reveal")

  const [revealed, setRevealed] = useState<Partial<Record<IdField, string>>>({})
  const [viewing, setViewing] = useState<Viewing | null>(null)
  const [pending, setPending] = useState<Target | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (Object.keys(revealed).length === 0 && !viewing) return
    const t = setTimeout(() => {
      setRevealed({})
      setViewing(null)
    }, AUTO_HIDE_MS)
    return () => clearTimeout(t)
  }, [revealed, viewing])

  async function run(t: Target) {
    setError(null)
    try {
      if (t.kind === "field") {
        const value = await revealIdentity(t.field)
        setRevealed((r) => ({ ...r, [t.field]: value }))
      } else {
        const v = await viewDocument(t.id)
        setViewing({ kind: t.doc, url: v.url, contentType: v.contentType })
      }
      setPending(null)
    } catch (e) {
      // The server decides whether the password was confirmed recently enough
      if (e instanceof ApiError && e.code === "STEP_UP_REQUIRED") return setPending(t)
      setPending(null)
      setError(e instanceof ApiError ? e.message : "Terjadi kesalahan.")
    }
  }

  const idFields: IdField[] = summary.type === "business" ? ["nib", "npwp", "repNik"] : ["nik", "npwp"]
  const names: [string, string | undefined][] =
    summary.type === "business"
      ? [
          ["Jenis badan usaha", summary.names.entityType],
          ["Nama badan usaha", summary.names.legalName],
          ["Penanggung jawab", summary.names.repName],
        ]
      : [["Nama sesuai KTP", summary.names.fullName]]
  const docs = Object.entries(summary.docs) as [DocKind, NonNullable<KycSummary["docs"][DocKind]>][]

  return (
    <div className="space-y-6">
      <section className="divide-y rounded-lg border bg-white px-4 md:px-6">
        {names.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm text-slate-900">{value}</p>
          </div>
        ))}

        {idFields.filter((f) => summary.masked[f]).map((f) => {
          const value = revealed[f]
          return (
            <div key={f} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{ID_LABEL[f]}</p>
                <p className="font-mono text-sm tracking-wide text-slate-900">
                  {value ? formatId(f, value) : summary.masked[f]}
                </p>
              </div>
              {canReveal &&
                (value ? (
                  <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setRevealed((r) => ({ ...r, [f]: undefined }))}>
                    <EyeOff className="size-4" aria-hidden /> Sembunyikan
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void run({ kind: "field", field: f })}>
                    <Eye className="size-4" aria-hidden /> Tampilkan
                  </Button>
                ))}
            </div>
          )
        })}
      </section>

      <section className="rounded-lg border bg-white p-4 md:p-6">
        <h3 className="font-medium text-slate-900">Dokumen</h3>
        <ul className="mt-2 divide-y">
          {docs.map(([kind, meta]) => (
            <li key={kind} className="space-y-2 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-slate-900">{DOC_SPECS[kind].label}</p>
                  <p className="truncate text-xs text-slate-500">
                    {meta.name} · {formatBytes(meta.size)} · {formatDateTime(meta.uploadedAt)}
                  </p>
                </div>
                {canReveal && meta.id && (
                  <Button variant="outline" size="sm" onClick={() => void run({ kind: "doc", doc: kind, id: meta.id as string })}>
                    Lihat
                  </Button>
                )}
              </div>

              {viewing?.kind === kind && (
                <div className="space-y-2 rounded-md bg-slate-50 p-3">
                  {viewing.contentType === "application/pdf" ? (
                    <a href={viewing.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand hover:underline">
                      Buka PDF di tab baru
                    </a>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={viewing.url} alt={DOC_SPECS[kind].label} referrerPolicy="no-referrer" className="max-h-96 rounded-md border" />
                  )}
                  <p className="text-xs text-slate-500">Tautan ini berlaku 60 detik, lalu dokumen disembunyikan lagi.</p>
                  <button type="button" onClick={() => setViewing(null)} className="text-xs text-brand hover:underline">
                    Tutup
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {pending && (
        <StepUpPrompt
          onCancel={() => setPending(null)}
          onConfirmed={() => {
            const t = pending
            setPending(null)
            void run(t)
          }}
        />
      )}

      <ServerError message={error} />
    </div>
  )
}