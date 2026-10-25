"use client"

import { cn } from "@workspace/ui/lib/utils"
import {
  PRESETS,
  defOf,
  grant,
  limitToProfiles,
  normalizePermissions,
  permissionsOfScope,
  revoke,
  type Permission,
  type PermissionScope,
} from "@/lib/permissions"
import { KIND_INFO, PROFILE_KINDS, type ProfileKind } from "@/lib/roles"

type Common = { value: Permission[]; onChange: (next: Permission[]) => void }

function PermissionRow({
  id,
  checked,
  onToggle,
  master,
}: {
  id: Permission
  checked: boolean
  onToggle: () => void
  master?: boolean
}) {
  const def = defOf(id)
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 hover:bg-slate-50",
        master && "bg-slate-50"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-1 size-4 shrink-0 accent-brand"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
          {def.label}
          {def.sensitive && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800">
              Sensitif
            </span>
          )}
        </span>
        <span className="block text-xs leading-snug text-slate-600">{def.description}</span>
      </span>
    </label>
  )
}

function Section({
  scope,
  title,
  note,
  value,
  onChange,
}: Common & { scope: PermissionScope; title: string; note?: string }) {
  const entries = permissionsOfScope(scope)
  const toggle = (id: Permission) => onChange(value.includes(id) ? revoke(value, id) : grant(value, id))

  return (
    <section className="rounded-lg border bg-white">
      <div className="border-b px-4 py-3">
        <h3 className="font-medium text-slate-900">{title}</h3>
        {note && <p className="text-xs text-slate-500">{note}</p>}
      </div>
      <div className="p-2">
        {entries.map((id, i) => {
          const def = defOf(id)
          const prev = i > 0 ? defOf(entries[i - 1]!) : undefined
          const header = def.group && def.group !== prev?.group ? def.group : null
          return (
            <div key={id}>
              {header && (
                <p className="px-3 pt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {header}
                </p>
              )}
              <PermissionRow
                id={id}
                checked={value.includes(id)}
                onToggle={() => toggle(id)}
                master={id.startsWith("mode:")}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function PermissionEditor({
  value,
  onChange,
  profiles,
}: Common & { profiles: ProfileKind[] }) {
  const kinds = PROFILE_KINDS.filter((k) => profiles.includes(k))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">Mulai dari:</span>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            title={p.description}
            onClick={() => onChange(limitToProfiles(normalizePermissions(p.permissions), profiles))}
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
          scope={k}
          title={`Area ${KIND_INFO[k].title}`}
          note={k === "client" ? "Daftar izin Client masih sementara dan akan disesuaikan dengan alur kerja Client." : undefined}
          value={value}
          onChange={onChange}
        />
      ))}
      <Section scope="shared" title="Umum" value={value} onChange={onChange} />

      {value.length === 0 && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Tanpa izin apa pun, anggota ini hanya akan melihat halaman &ldquo;Belum ada akses&rdquo;.
        </p>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Pengelolaan tim dan akun hanya untuk pemilik akun dan tidak bisa diberikan kepada anggota.
        Izin untuk profil yang belum Anda miliki baru bisa diatur setelah profil itu dibuat.
      </p>
    </div>
  )
}