"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { ServerError } from "@/components/auth/server-error"
import { formatDateTime } from "@/lib/format"
import type { Permission } from "@/lib/permissions"
import type { TeamMember } from "@/lib/team"
import {
  deleteTeamMember,
  getTeamMember,
  resetMemberPassword,
  updateTeamMember,
} from "@/lib/team-api"
import { useOwner } from "@/lib/use-owner"
import { CredentialsCard } from "./credentials-card"
import { PermissionEditor } from "./permission-editor"
import { NoOwner } from "./team-view"

const sameSet = (a: Permission[], b: Permission[]) =>
  a.length === b.length && a.every((p) => b.includes(p))

type Confirm = "reset" | "status" | "delete" | null

function ActionRow({
  title,
  description,
  buttonLabel,
  open,
  onOpen,
  onCancel,
  onConfirm,
  confirmLabel,
  disabled,
  destructive,
  children,
}: {
  title: string
  description: string
  buttonLabel: string
  open: boolean
  onOpen: () => void
  onCancel: () => void
  onConfirm: () => void
  confirmLabel: string
  disabled?: boolean
  destructive?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-3 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
        {!open && (
          <Button variant="outline" size="sm" onClick={onOpen}>
            {buttonLabel}
          </Button>
        )}
      </div>
      {open && (
        <div className="space-y-3 rounded-md bg-slate-50 p-3">
          {children}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={destructive ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={disabled}
            >
              {confirmLabel}
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MemberManage({ id }: { id: string }) {
  const router = useRouter()
  const owner = useOwner()

  const [member, setMember] = useState<TeamMember | null | undefined>(undefined)
  const [displayName, setDisplayName] = useState("")
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [typed, setTyped] = useState("")

  useEffect(() => {
    if (!owner) return
    let cancelled = false
    getTeamMember(owner, id).then((m) => {
      if (cancelled) return
      setMember(m)
      setDisplayName(m?.displayName ?? "")
      setPermissions(m?.permissions ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [owner, id])

  if (owner === undefined) return null
  if (owner === null) return <NoOwner />
  if (member === undefined) return <p className="text-sm text-slate-500">Memuat…</p>

  if (member === null) {
    return (
      <div className="space-y-3 rounded-lg border bg-white p-8 text-center">
        <p className="font-medium text-slate-900">Anggota tidak ditemukan</p>
        <Link href="/team" className="text-sm text-brand hover:underline">← Kembali ke Team</Link>
      </div>
    )
  }

  const m = member
  const dirty = displayName.trim() !== (m.displayName ?? "") || !sameSet(permissions, m.permissions)

  async function save() {
    if (!owner) return
    setBusy(true)
    setError(null)
    setNotice(null)
    const res = await updateTeamMember(owner, m.id, { displayName, permissions })
    setBusy(false)
    if (!res.ok) return setError(res.message)
    setMember(res.data)
    setDisplayName(res.data.displayName ?? "")
    setPermissions(res.data.permissions)
    setNotice("Perubahan disimpan.")
  }

  async function toggleStatus() {
    if (!owner) return
    setBusy(true)
    setError(null)
    const res = await updateTeamMember(owner, m.id, {
      status: m.status === "active" ? "disabled" : "active",
    })
    setBusy(false)
    setConfirm(null)
    if (!res.ok) return setError(res.message)
    setMember(res.data)
    setNotice(res.data.status === "active" ? "Akun diaktifkan kembali." : "Akun dinonaktifkan.")
  }

  async function resetPassword() {
    if (!owner) return
    setBusy(true)
    setError(null)
    const res = await resetMemberPassword(owner, m.id)
    setBusy(false)
    setConfirm(null)
    if (!res.ok) return setError(res.message)
    setMember(res.data.member)
    setTempPassword(res.data.tempPassword)
  }

  async function remove() {
    if (!owner) return
    setBusy(true)
    const res = await deleteTeamMember(owner, m.id)
    if (!res.ok) {
      setBusy(false)
      return setError(res.message)
    }
    router.replace("/team")
  }

  return (
    <div className="space-y-6">
      <Link href="/team" className="text-sm text-brand hover:underline">← Kembali ke Team</Link>

      <section className="rounded-lg border bg-white p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl text-slate-900">{m.displayName || m.username}</h2>
          <span className={m.status === "active" ? "rounded bg-green-100 px-2 py-0.5 text-xs text-green-800" : "rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"}>
            {m.status === "active" ? "Aktif" : "Dinonaktifkan"}
          </span>
          {m.mustChangePassword && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Belum ganti password</span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-mono">{m.username}</span> @ <span className="font-mono">{m.account}</span>
          {" · "}Dibuat {formatDateTime(m.createdAt)}
          {" · "}Terakhir masuk {m.lastSignInAt ? formatDateTime(m.lastSignInAt) : "belum pernah"}
        </p>
      </section>

      {tempPassword && (
        <CredentialsCard
          title="Password sementara baru"
          account={m.account}
          username={m.username}
          password={tempPassword}
        />
      )}

      <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
        <h2 className="font-medium text-slate-900">Profil &amp; izin</h2>

        <div className="max-w-md space-y-1.5">
          <label htmlFor="displayName" className="text-sm font-medium text-slate-800">
            Nama tampilan
          </label>
          <Input
            id="displayName"
            value={displayName}
            maxLength={80}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <PermissionEditor value={permissions} onChange={setPermissions} profiles={owner.profiles} />

        <ServerError message={error} />
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={!dirty || busy}>Simpan perubahan</Button>
          {dirty && <span className="text-xs text-slate-500">Ada perubahan yang belum disimpan</span>}
        </div>
        <p className="text-xs text-slate-500">
          Mode mock: perubahan izin berlaku pada sesi masuk anggota berikutnya. Dengan backend
          sungguhan, izin dicek di server pada setiap permintaan, jadi berlaku langsung.
        </p>
      </section>

      <section className="divide-y rounded-lg border bg-white p-4 md:p-6">
        <ActionRow
          title="Reset password"
          description="Membuat password sementara baru. Password lama langsung tidak berlaku."
          buttonLabel="Reset password"
          open={confirm === "reset"}
          onOpen={() => setConfirm("reset")}
          onCancel={() => setConfirm(null)}
          onConfirm={resetPassword}
          confirmLabel="Ya, reset"
          disabled={busy}
        />

        <ActionRow
          title={m.status === "active" ? "Nonaktifkan akun" : "Aktifkan kembali akun"}
          description={
            m.status === "active"
              ? "Anggota tidak bisa masuk sampai Anda mengaktifkannya lagi. Data dan izinnya tetap tersimpan."
              : "Anggota bisa masuk kembali dengan izin yang sama."
          }
          buttonLabel={m.status === "active" ? "Nonaktifkan" : "Aktifkan"}
          open={confirm === "status"}
          onOpen={() => setConfirm("status")}
          onCancel={() => setConfirm(null)}
          onConfirm={toggleStatus}
          confirmLabel={m.status === "active" ? "Ya, nonaktifkan" : "Ya, aktifkan"}
          disabled={busy}
        />

        <ActionRow
          title="Hapus anggota"
          description="Menghapus akun ini secara permanen. Tindakan ini tidak bisa dibatalkan."
          buttonLabel="Hapus"
          open={confirm === "delete"}
          onOpen={() => {
            setTyped("")
            setConfirm("delete")
          }}
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
          confirmLabel="Hapus permanen"
          destructive
          disabled={busy || typed !== m.username}
        >
          <label className="block text-xs text-slate-700">
            Ketik <span className="font-mono font-semibold">{m.username}</span> untuk mengonfirmasi
            <Input className="mt-1.5 bg-white" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
        </ActionRow>
      </section>
    </div>
  )
}