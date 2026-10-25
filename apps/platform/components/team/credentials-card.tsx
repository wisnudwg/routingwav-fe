"use client"

import { signInUrl } from "@/lib/team"
import { CopyButton } from "./copy-button"

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className={mono ? "truncate font-mono text-sm text-slate-900" : "truncate text-sm text-slate-900"}>
          {value}
        </p>
      </div>
      <CopyButton value={value} />
    </div>
  )
}

export function CredentialsCard({
  account,
  username,
  password,
  title = "Kredensial anggota tim",
}: {
  account: string
  username: string
  password: string
  title?: string
}) {
  const url = signInUrl(window.location.origin, account)
  const everything = [
    "Routing.com: masuk sebagai anggota tim",
    `Tautan: ${url}`,
    `ID akun: ${account}`,
    `Username: ${username}`,
    `Password sementara: ${password}`,
  ].join("\n")

  return (
    <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div>
        <h3 className="font-medium text-slate-900">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-amber-900">
          Password sementara ini <strong>hanya ditampilkan sekali</strong>. Salin sekarang dan kirim
          lewat saluran yang aman, bukan grup chat. Anggota wajib menggantinya saat masuk pertama kali.
        </p>
      </div>

      <div className="space-y-2">
        <Row label="Tautan masuk" value={url} />
        <Row label="ID akun" value={account} mono />
        <Row label="Username" value={username} mono />
        <Row label="Password sementara" value={password} mono />
      </div>

      <CopyButton value={everything} label="Salin semuanya" />
    </section>
  )
}