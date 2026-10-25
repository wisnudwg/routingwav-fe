"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { ServerError } from "@/components/auth/server-error"
import { ACTION_INFO, ACTION_TYPES, type ActionType } from "@/lib/approvals"
import {
  listDelegations,
  removeDelegation,
  saveDelegation,
  type DelegationRow,
} from "@/lib/approvals-api"
import { APPROVALS_EVENT } from "@/lib/approvals-store"
import type { TeamMember } from "@/lib/team"
import { listTeam } from "@/lib/team-api"
import { useActor } from "@/lib/use-actor"
import { useOwner } from "@/lib/use-owner"
import { NoOwner } from "./team-view"

type FormState = { username: string; types: ActionType[]; scope: "all" | "selected"; selected: string[] }
const EMPTY: FormState = { username: "", types: [], scope: "all", selected: [] }

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

export function DelegationView() {
  const owner = useOwner()
  const actor = useActor()
  const [members, setMembers] = useState<TeamMember[] | null>(null)
  const [rows, setRows] = useState<DelegationRow[] | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!owner) return
    let cancelled = false
    const load = async () => {
      const [m, d] = await Promise.all([listTeam(owner), listDelegations(owner)])
      if (cancelled) return
      setMembers(m)
      setRows(d)
    }
    void load()
    window.addEventListener(APPROVALS_EVENT, load)
    return () => {
      cancelled = true
      window.removeEventListener(APPROVALS_EVENT, load)
    }
  }, [owner])

  if (owner === undefined || !actor) return null
  if (owner === null) return <NoOwner />
  if (!members || !rows) return <p className="text-sm text-slate-500">Memuat…</p>

  const active = members.filter((m) => m.status === "active")
  const requesterChoices = active.filter((m) => m.username !== form.username)

  function edit(row: DelegationRow) {
    setError(null)
    setNotice(null)
    setForm({
      username: row.username,
      types: row.types,
      scope: row.requesters === "all" ? "all" : "selected",
      selected: row.requesters === "all" ? [] : row.requesters,
    })
  }

  async function save() {
    if (!owner || !actor) return
    setError(null)
    setNotice(null)
    if (!form.username) return setError("Pilih anggota penerima delegasi.")
    if (form.types.length === 0) return setError("Pilih minimal satu jenis tindakan.")
    if (form.scope === "selected" && form.selected.length === 0) return setError("Pilih minimal satu anggota pemohon.")

    setBusy(true)
    const res = await saveDelegation(owner, actor.label, {
      username: form.username,
      types: form.types,
      requesters: form.scope === "all" ? "all" : form.selected,
    })
    setBusy(false)
    if (!res.ok) return setError(res.message)
    setForm(EMPTY)
    setNotice("Delegasi disimpan.")
  }

  async function remove(username: string) {
    if (!owner || !actor) return
    const res = await removeDelegation(owner, actor.label, username)
    if (!res.ok) setError(res.message)
  }

  return (
    <div className="space-y-6">
      <Link href="/team" className="text-sm text-brand hover:underline">← Kembali ke Team</Link>

      <section className="space-y-1 rounded-lg border bg-white p-4 md:p-6">
        <h2 className="font-medium text-slate-900">Delegasi persetujuan</h2>
        <p className="text-sm text-slate-600">
          Secara bawaan hanya Anda yang memutuskan permintaan dari anggota tim. Delegasi memberi anggota
          tertentu hak menyetujui atau menolak, untuk <strong>nominal berapa pun</strong>, atas jenis
          tindakan dan pemohon yang Anda pilih. Penerima delegasi tidak bisa memutuskan permintaannya
          sendiri, dan tidak bisa mengubah rekening bank, delegasi, atau perwakilan.
        </p>
      </section>

      {rows.length > 0 && (
        <section className="divide-y rounded-lg border bg-white px-4 md:px-6">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {r.displayName || r.username}
                  {r.memberStatus === "disabled" && <span className="ml-2 text-xs text-slate-500">(dinonaktifkan, tidak berlaku)</span>}
                </p>
                <p className="text-xs text-slate-600">
                  {r.types.map((t) => ACTION_INFO[t].label).join(", ")} · pemohon{" "}
                  {r.requesters === "all" ? "semua anggota" : r.requesters.join(", ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(r)}>Ubah</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r.username)}>Cabut</Button>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-5 rounded-lg border bg-white p-4 md:p-6">
        <h2 className="font-medium text-slate-900">{rows.some((r) => r.username === form.username) ? "Ubah delegasi" : "Tambah delegasi"}</h2>

        <div className="max-w-md space-y-1.5">
          <label htmlFor="delegate" className="text-sm font-medium text-slate-800">Penerima delegasi</label>
          <select
            id="delegate"
            value={form.username}
            onChange={(e) => setForm({ ...EMPTY, username: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="">Pilih anggota</option>
            {active.map((m) => (
              <option key={m.id} value={m.username}>{m.displayName ? `${m.displayName} (${m.username})` : m.username}</option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-800">Boleh memutuskan</legend>
          {ACTION_TYPES.map((t) => (
            <label key={t} className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-brand"
                checked={form.types.includes(t)}
                onChange={() => setForm((f) => ({ ...f, types: toggle(f.types, t) }))}
              />
              <span>
                <span className="font-medium text-slate-900">{ACTION_INFO[t].label}</span>
                <span className="block text-xs text-slate-600">{ACTION_INFO[t].description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-800">Atas permintaan dari</legend>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="scope" checked={form.scope === "all"} onChange={() => setForm((f) => ({ ...f, scope: "all" }))} className="size-4 accent-brand" />
            Semua anggota tim
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" name="scope" checked={form.scope === "selected"} onChange={() => setForm((f) => ({ ...f, scope: "selected" }))} className="size-4 accent-brand" />
            Anggota tertentu saja
          </label>

          {form.scope === "selected" && (
            <div className="grid gap-2 pl-6 sm:grid-cols-2">
              {requesterChoices.length === 0 && <p className="text-xs text-slate-500">Belum ada anggota lain.</p>}
              {requesterChoices.map((m) => (
                <label key={m.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 accent-brand"
                    checked={form.selected.includes(m.username)}
                    onChange={() => setForm((f) => ({ ...f, selected: toggle(f.selected, m.username) }))}
                  />
                  {m.displayName || m.username}
                </label>
              ))}
            </div>
          )}
        </fieldset>

        <ServerError message={error} />
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}

        <div className="flex gap-2">
          <Button onClick={save} disabled={busy}>Simpan delegasi</Button>
          {form.username && <Button variant="ghost" onClick={() => setForm(EMPTY)}>Batal</Button>}
        </div>
        <p className="text-xs text-slate-500">
          Menyimpan delegasi juga memberi anggota izin &ldquo;Lihat persetujuan&rdquo; agar bisa membuka halaman Approvals.
        </p>
      </section>
    </div>
  )
}