"use client"

import { cn } from "@workspace/ui/lib/utils"

export type UserType = "root" | "iam"

const TYPES: { value: UserType; title: string; hint: string; desc: string }[] = [
  {
    value: "root",
    title: "Pemilik akun",
    hint: "Root user",
    desc: "Akun yang dibuat saat mendaftar. Masuk dengan email.",
  },
  {
    value: "iam",
    title: "Anggota tim",
    hint: "IAM user",
    desc: "Dibuat oleh pemilik akun. Masuk dengan ID akun & username.",
  },
]

export function UserTypeSwitch({
  value,
  onChange,
}: {
  value: UserType
  onChange: (v: UserType) => void
}) {
  return (
    <fieldset>
      <legend className="sr-only">Jenis pengguna</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {TYPES.map((t) => (
          <label
            key={t.value}
            className={cn(
              "cursor-pointer rounded-lg border p-3 transition-colors hover:bg-slate-50",
              "has-checked:border-brand has-checked:bg-brand/5",
              "has-focus-visible:ring-2 has-focus-visible:ring-brand/40"
            )}
          >
            <input
              type="radio"
              name="user-type"
              value={t.value}
              checked={value === t.value}
              onChange={() => onChange(t.value)}
              className="sr-only"
            />
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-slate-900">{t.title}</span>
              <span className="text-[11px] uppercase tracking-wide text-slate-500">{t.hint}</span>
            </span>
            <span className="mt-1 block text-xs leading-snug text-slate-600">{t.desc}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}