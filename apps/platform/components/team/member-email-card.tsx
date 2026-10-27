"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ServerError } from "@/components/auth/server-error"
import { removeMemberEmail, resendMemberEmailVerification, setMemberEmail } from "@/lib/member-email-api"
import type { TeamMember } from "@/lib/team"
import type { ApiResult, Owner } from "@/lib/team-api"
import { useActor } from "@/lib/use-actor"

export function MemberEmailCard({
  owner,
  member,
  onUpdated,
}: {
  owner: Owner
  member: TeamMember
  onUpdated: (m: TeamMember) => void
}) {
  const actor = useActor()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function run(fn: () => Promise<ApiResult<TeamMember>>, success: string) {
    setBusy(true)
    setError(null)
    setNotice(null)
    const res = await fn()
    setBusy(false)
    if (!res.ok) return setError(res.message)
    onUpdated(res.data)
    setEditing(false)
    setValue("")
    setNotice(success)
  }

  const label = actor?.label ?? "owner"
  const showForm = editing || !member.email

  return (
    <section className="space-y-3 rounded-lg border bg-white p-4 md:p-6">
      <div>
        <h2 className="font-medium text-slate-900">Email notifikasi</h2>
        <p className="text-xs text-slate-600">
          Opsional. Dipakai hanya untuk mengirim notifikasi, bukan untuk masuk atau mengatur ulang password.
          Alamat harus diverifikasi lewat tautan sebelum menerima email apa pun selain tautan itu.
        </p>
      </div>

      {member.email && !editing && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-900">{member.email}</p>
            <span
              className={
                member.emailVerified
                  ? "rounded bg-green-100 px-2 py-0.5 text-xs text-green-800"
                  : "rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800"
              }
            >
              {member.emailVerified ? "Terverifikasi" : "Menunggu verifikasi"}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {!member.emailVerified && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => run(() => resendMemberEmailVerification(owner, member.id), "Email verifikasi dikirim ulang.")}
              >
                Kirim ulang
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Ganti</Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => run(() => removeMemberEmail(owner, label, member.id), "Email dihapus.")}
            >
              Hapus
            </Button>
          </div>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void run(() => setMemberEmail(owner, label, member.id, value), "Email verifikasi dikirim ke alamat tersebut.")
          }}
          className="flex flex-wrap items-end gap-2"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor="member-email" className="text-sm font-medium text-slate-800">Alamat email</label>
            <Input
              id="member-email"
              type="email"
              autoComplete="off"
              placeholder="nama@email.com"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button type="submit" size="sm" disabled={busy || !value.trim()}>Simpan &amp; kirim verifikasi</Button>
          {member.email && (
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Batal</Button>
          )}
        </form>
      )}

      <ServerError message={error} />
      {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
    </section>
  )
}