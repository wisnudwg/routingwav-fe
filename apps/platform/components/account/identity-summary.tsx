"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { PasswordInput } from "@/components/auth/password-input"
import { ServerError } from "@/components/auth/server-error"
import { useSession } from "@/lib/auth"
import { formatBytes, formatDateTime } from "@/lib/format"
import { DOC_SPECS, ID_LABEL, formatId, type DocKind, type DocMeta, type IdField, type KycSummary } from "@/lib/kyc"
import { openDocument, revealIdentity, stepUp } from "@/lib/kyc-api"
import { can } from "@/lib/permissions"

type Target = { kind: "field"; field: IdField } | { kind: "doc"; doc: DocKind }

const ELEVATION_MS = 5 * 60_000 // one password check unlocks reveals for 5 minutes
const AUTO_HIDE_MS = 60_000 // revealed values hide again after 60 seconds

export function IdentitySummary({
  summary,
  alias,
  actor,
}: {
  summary: KycSummary
  alias: string
  actor: string
}) {
  const session = useSession()
  const canReveal = !!session && can(session, "identity:reveal")

  const [elevatedUntil, setElevatedUntil] = useState(0)
  const [revealed, setRevealed] = useState<Partial<Record<IdField, string>>>({})
  const [openedDoc, setOpenedDoc] = useState<DocKind | null>(null)
  const [pending, setPending] = useState<Target | null>(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Re-mask everything after a minute
  useEffect(() => {
    if (Object.keys(revealed).length === 0 && !openedDoc) return
    const t = setTimeout(() => {
      setRevealed({})
      setOpenedDoc(null)
    }, AUTO_HIDE_MS)
    return () => clearTimeout(t)
  }, [revealed, openedDoc])

  async function run(t: Target) {
    if (t.kind === "field") {
      const res = await revealIdentity(alias, actor, t.field)
      if (res.ok) setRevealed((r) => ({ ...r, [t.field]: res.data }))
      else setError(res.message)
    } else {
      const res = await openDocument(alias, actor, t.doc)
      if (res.ok) setOpenedDoc(t.doc)
      else setError(res.message)
    }
  }

  function request(t: Target) {
    setError(null)
    if (Date.now() < elevatedUntil) {
      void run(t)
      return
    }
    setPending(t)
    setPassword("")
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault()
    if (!pending) return
    setBusy(true)
    setError(null)

    if (!(await stepUp(password))) {
      setBusy(false)
      setError("Password salah.")
      return
    }
    setElevatedUntil(Date.now() + ELEVATION_MS)
    const target = pending
    setPending(null)
    setPassword("")
    await run(target)
    setBusy(false)
  }

  function hide(field: IdField) {
    setRevealed((r) => {
      const next = { ...r }
      delete next[field]
      return next
    })
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
  const docs = Object.entries(summary.docs) as [DocKind, DocMeta][]

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
                  <Button variant="ghost" size="sm" onClick={() => hide(f)} className="gap-1.5">
                    <EyeOff className="size-4" aria-hidden /> Sembunyikan
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => request({ kind: "field", field: f })} className="gap-1.5">
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
                {canReveal && (
                  <Button variant="outline" size="sm" onClick={() => request({ kind: "doc", doc: kind })}>
                    Lihat
                  </Button>
                )}
              </div>
              {openedDoc === kind && (
                <div className="rounded-md bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                  Simulasi: di produksi, dokumen tampil lewat tautan bertanda air (nama pengakses dan
                  waktu) yang berlaku 60 detik, tanpa tombol unduh.{" "}
                  <button type="button" onClick={() => setOpenedDoc(null)} className="text-brand hover:underline">
                    Tutup
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {pending && (
        <form onSubmit={confirm} className="space-y-3 rounded-lg border border-brand/30 bg-brand/5 p-4">
          <p className="text-sm text-slate-800">
            Masukkan password Anda untuk melihat data identitas. Akses ini dicatat di log aktivitas.
          </p>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            aria-label="Password"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy}>Konfirmasi</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPending(null)}>Batal</Button>
          </div>
        </form>
      )}

      <ServerError message={error} />
    </div>
  )
}