"use client"

import { useMemo } from "react"
import { cn } from "@workspace/ui/lib/utils"
import type { Permission } from "@/lib/api-types"
import { usePermissionMeta } from "@/lib/permission-meta"
import { grantIn, indexMeta, limitTo, normalizeIn, revokeIn, type MetaEntry, type MetaIndex } from "@/lib/permission-graph"
import { KIND_INFO, PROFILE_KINDS, type ProfileKind } from "@/lib/roles"

type Common = { value: Permission[]; onChange: (next: Permission[]) => void }

function PermissionRow({
  entry,
  checked,
  onToggle,
  master,
}: {
  entry: MetaEntry
  checked: boolean
  onToggle: () => void
  master?: boolean
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 hover:bg-slate-50",
        master && "bg-slate-50",
      )}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1 size-4 shrink-0 accent-brand" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
          {entry.label}
          {entry.sensitive && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
              Sensitif
            </span>
          )}
        </span>
        <span className="block text-xs leading-snug text-slate-600">{entry.description}</span>
      </span>
    </label>
  )
}

function Section({
  title,
  note,
  entries,
  index,
  value,
  onChange,
}: Common & { title: string; note?: string; entries: MetaEntry[]; index: MetaIndex }) {
  const toggle = (id: Permission) => onChange(value.includes(id) ? revokeIn(index, value, id) : grantIn(index, value, id))

  return (
    <section className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-medium text-slate-900">{title}</h3>
        {note && <p className="text-xs text-slate-500">{note}</p>}
      </div>
      <div className="p-2">
        {entries.map((entry, i) => {
          const header = entry.group && entry.group !== entries[i - 1]?.group ? entry.group : null
          return (
            <div key={entry.id}>
              {header && (
                <p className="px-3 pt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">{header}</p>
              )}
              <PermissionRow
                entry={entry}
                checked={value.includes(entry.id)}
                onToggle={() => toggle(entry.id)}
                master={entry.id.startsWith("mode:")}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PermissionEditor({ value, onChange, profiles }: Common & { profiles: ProfileKind[] }) {
  const { meta, error } = usePermissionMeta()
  const index = useMemo(() => (meta ? indexMeta(meta) : null), [meta])

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>
  if (!meta || !index) return <p className="text-sm text-slate-500">Memuat daftar izin…</p>

  const entriesOf = (scope: string) => meta.permissions.filter((p) => p.scope === scope && !p.rootOnly)
  const kinds = PROFILE_KINDS.filter((k) => profiles.includes(k))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Mulai dari:</span>
        {meta.presets.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.description}
            onClick={() => onChange(limitTo(index, normalizeIn(index, p.permissions), profiles))}
            className="rounded-md border px-3 py-1 text-sm text-slate-700 hover:bg-slate-50"
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange([])}
          className="rounded-md px-3 py-1 text-sm text-slate-500 hover:bg-slate-50"
        >
          Kosongkan
        </button>
        <span className="ml-auto text-xs text-slate-500">{value.length} izin dipilih</span>
      </div>

      {kinds.map((k) => (
        <Section
          key={k}
          title={`Area ${KIND_INFO[k].title}`}
          note={k === "client" ? "Daftar izin Client masih sementara dan akan disesuaikan dengan alur kerja Client." : undefined}
          entries={entriesOf(k)}
          index={index}
          value={value}
          onChange={onChange}
        />
      ))}
      <Section title="Umum" entries={entriesOf("shared")} index={index} value={value} onChange={onChange} />

      {value.length === 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tanpa izin apa pun, anggota ini hanya akan melihat halaman &ldquo;Belum ada akses&rdquo;.
        </p>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Pengelolaan tim dan akun hanya untuk pemilik akun dan tidak bisa diberikan kepada anggota. Izin untuk
        profil yang belum Anda miliki baru bisa diatur setelah profil itu dibuat.
      </p>
    </div>
  )
}