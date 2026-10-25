"use client"

import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ServerError } from "@/components/auth/server-error"
import { NoOwner } from "@/components/team/team-view"
import { formatDate } from "@/lib/format"
import { validateFile, type KycSummary } from "@/lib/kyc"
import { getKycSummary } from "@/lib/kyc-api"
import {
  designateRepresentative,
  listRepresentatives,
  revokeRepresentative,
  type Representative,
} from "@/lib/representative-api"
import { KIND_INFO, PROFILE_KINDS, type ProfileKind } from "@/lib/roles"
import type { TeamMember } from "@/lib/team"
import { listTeam, type Owner } from "@/lib/team-api"
import { useActor } from "@/lib/use-actor"
import { useOwner } from "@/lib/use-owner"
import { DocumentInput } from "./document-input"

const today = () => new Date().toISOString().slice(0, 10)

function RepCard({
  kind,
  owner,
  label,
  members,
  current,
  kyc,
  onChanged,
}: {
  kind: ProfileKind
  owner: Owner
  label: string
  members: TeamMember[]
  current?: Representative
  kyc: KycSummary
  onChanged: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState("")
  const [since, setSince] = useState(today())
  const [file, setFile] = useState<File | undefined>()
  const [fileError, setFileError] = useState<string | undefined>()
  const [confirmRevoke, setConfirmRevoke] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isBusiness = kyc.type === "business"
  const legalName = kyc.names.legalName ?? kyc.names.fullName
  const active = members.filter((m) => m.status === "active")
  const repMember = current ? members.find((m) => m.username === current.username) : undefined
  const repName = repMember?.displayName || current?.username
  const showForm = !current || editing

  function pick(f: File | null) {
    if (!f) return setFile(undefined)
    const problem = validateFile(f, "poa")
    setFileError(problem ?? undefined)
    if (!problem) setFile(f)
  }

  async function save() {
    setError(null)
    if (!username) return setError("Pilih anggota yang akan menjadi perwakilan.")
    if (isBusiness && !file) return setFileError("Dokumen wajib diunggah untuk badan usaha.")

    setBusy(true)
    const res = await designateRepresentative(owner, label, {
      kind,
      username,
      since,
      document: file ? { name: file.name, size: file.size, type: file.type, uploadedAt: new Date().toISOString() } : undefined,
    })
    setBusy(false)
    if (!res.ok) return setError(res.message)
    setEditing(false)
    setUsername("")
    setFile(undefined)
    onChanged()
  }

  async function revoke() {
    setBusy(true)
    const res = await revokeRepresentative(owner, label, kind)
    setBusy(false)
    setConfirmRevoke(false)
    if (!res.ok) return setError(res.message)
    onChanged()
  }

  return (
    <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
      <h2 className="font-medium text-slate-900">Profil {KIND_INFO[kind].title}</h2>

      {current && (
        <div className="space-y-1">
          <p className="text-sm text-slate-900">
            Perwakilan: <strong>{repName}</strong> <span className="font-mono text-xs text-slate-500">({current.username})</span>
          </p>
          <p className="text-xs text-slate-600">
            Berlaku sejak {formatDate(current.since)}
            {current.document && ` · dokumen: ${current.document.name}`}
          </p>
          <p className="text-xs text-slate-500">
            Pratinjau pada kontrak:{" "}
            <em>
              {legalName ?? "(nama terverifikasi belum tersedia)"}, diwakili oleh {repName}
              {isBusiness ? " berdasarkan surat kuasa" : ""}
            </em>
          </p>
        </div>
      )}

      {!current && (
        <p className="text-sm text-slate-600">
          Belum ada perwakilan. Hanya Anda sebagai pemilik akun yang dapat menandatangani kontrak.
        </p>
      )}

      {showForm ? (
        <div className="space-y-4 rounded-md bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor={`rep-${kind}`} className="text-sm font-medium text-slate-800">Anggota</label>
              <select
                id={`rep-${kind}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">Pilih anggota</option>
                {active.map((m) => (
                  <option key={m.id} value={m.username}>{m.displayName ? `${m.displayName} (${m.username})` : m.username}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`since-${kind}`} className="text-sm font-medium text-slate-800">Berlaku sejak</label>
              <Input id={`since-${kind}`} type="date" value={since} onChange={(e) => setSince(e.target.value)} className="bg-white" />
            </div>
          </div>

          {isBusiness && <DocumentInput kind="poa" required file={file} error={fileError} onChange={pick} />}
          {!isBusiness && (
            <p className="text-xs text-slate-500">
              Untuk akun perorangan, surat kuasa tidak diwajibkan, tetapi dianjurkan bila perwakilan menandatangani atas nama Anda.
            </p>
          )}

          <ServerError message={error} />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={busy}>Tunjuk perwakilan</Button>
            {current && <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Batal</Button>}
          </div>
          <p className="text-xs text-slate-500">
            Anggota terpilih otomatis mendapat izin &ldquo;Tandatangani kontrak&rdquo;. Penandatanganan tetap memerlukan persetujuan Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Ganti perwakilan</Button>
            {confirmRevoke ? (
              <>
                <Button size="sm" variant="destructive" disabled={busy} onClick={revoke}>Ya, cabut</Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(false)}>Batal</Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setConfirmRevoke(true)}>Cabut penunjukan</Button>
            )}
          </div>
          <ServerError message={error} />
        </div>
      )}
    </section>
  )
}

export function RepresentativeView() {
  const owner = useOwner()
  const actor = useActor()
  const [data, setData] = useState<{ reps: Representative[]; members: TeamMember[]; kyc: KycSummary } | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!owner) return
    let cancelled = false
    Promise.all([listRepresentatives(owner.alias), listTeam(owner), getKycSummary(owner.alias)]).then(
      ([reps, members, kyc]) => {
        if (!cancelled) setData({ reps, members, kyc })
      }
    )
    return () => {
      cancelled = true
    }
  }, [owner, version])

  if (owner === undefined || !actor) return null
  if (owner === null) return <NoOwner />
  if (!data) return <p className="text-sm text-slate-500">Memuat…</p>

  const kinds = PROFILE_KINDS.filter((k) => owner.profiles.includes(k))

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Perwakilan adalah orang yang tampil di kontrak sebagai pihak yang bertindak atas nama akun Anda
        (&ldquo;diwakili oleh …&rdquo;). Anda tetap pihak yang bertanggung jawab. Untuk badan usaha,
        sertakan dokumen yang menunjukkan kewenangannya.
      </p>

      {data.members.length === 0 && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Belum ada anggota tim. Tambahkan anggota di menu Team terlebih dahulu.
        </p>
      )}

      {kinds.map((k) => (
        <RepCard
          key={k}
          kind={k}
          owner={owner}
          label={actor.label}
          members={data.members}
          current={data.reps.find((r) => r.kind === k)}
          kyc={data.kyc}
          onChanged={() => setVersion((v) => v + 1)}
        />
      ))}
    </div>
  )
}