"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { formatDateTime } from "@/lib/format"
import { signInUrl, type TeamMember } from "@/lib/team"
import { listTeam } from "@/lib/team-api"
import { useOwner } from "@/lib/use-owner"
import { CopyButton } from "./copy-button"

export function NoOwner() {
  return (
    <div role="alert" className="rounded-lg border bg-white p-8 text-center">
      <p className="font-medium text-slate-900">ID akun tidak ditemukan</p>
      <p className="mt-1 text-sm text-slate-600">Keluar lalu masuk kembali sebagai pemilik akun.</p>
    </div>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "slate" | "amber" }) {
  const tones = {
    green: "bg-green-100 text-green-800",
    slate: "bg-slate-100 text-slate-600",
    amber: "bg-amber-100 text-amber-800",
  } as const
  return <span className={cn("rounded px-2 py-0.5 text-xs", tones[tone])}>{children}</span>
}

export function TeamView() {
  const owner = useOwner()
  const [members, setMembers] = useState<TeamMember[] | null>(null)

  useEffect(() => {
    if (!owner) return
    let cancelled = false
    listTeam(owner).then((m) => {
      if (!cancelled) setMembers(m)
    })
    return () => {
      cancelled = true
    }
  }, [owner])

  if (owner === undefined) return null
  if (owner === null) return <NoOwner />

  const url = signInUrl(window.location.origin, owner.alias)

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-lg border bg-white p-4">
        <h2 className="font-medium text-slate-900">Tautan masuk untuk tim</h2>
        <p className="text-xs text-slate-600">
          Bagikan tautan ini kepada anggota tim Anda. ID akun Anda:{" "}
          <span className="font-mono text-slate-900">{owner.alias}</span>
        </p>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded bg-slate-50 px-3 py-2 text-xs text-slate-800">{url}</code>
          <CopyButton value={url} />
        </div>
      </section>

      {/* <div className="flex items-center justify-between">
        <h2 className="text-xl text-slate-900">Anggota tim</h2>
        <Link href="/team/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
          <Plus className="size-4" aria-hidden />
          Tambah anggota
        </Link>
      </div> */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl text-slate-900">Anggota tim</h2>
        <div className="flex gap-2">
          <Link href="/team/delegation" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Delegasi persetujuan
          </Link>
          <Link href="/team/new" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
            <Plus className="size-4" aria-hidden />
            Tambah anggota
          </Link>
        </div>
      </div>

      {members === null ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : members.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center">
          <p className="font-medium text-slate-900">Belum ada anggota tim</p>
          <p className="mt-1 text-sm text-slate-600">
            Tambahkan anggota dan atur apa saja yang boleh mereka lakukan.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table className="min-w-176">
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide">
                <TableHead className="pl-4">Anggota</TableHead>
                <TableHead>Akses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir masuk</TableHead>
                <TableHead className="pr-4 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="py-3 pl-4">
                    <p className="font-medium text-slate-900">{m.displayName || m.username}</p>
                    {m.displayName && <p className="text-xs text-slate-500">{m.username}</p>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {m.permissions.includes("mode:talent") && <Badge tone="slate">Talent</Badge>}
                      {m.permissions.includes("mode:client") && <Badge tone="slate">Client</Badge>}
                      <span className="text-xs text-slate-500">{m.permissions.length} izin</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={m.status === "active" ? "green" : "slate"}>
                        {m.status === "active" ? "Aktif" : "Dinonaktifkan"}
                      </Badge>
                      {m.mustChangePassword && <Badge tone="amber">Belum ganti password</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-slate-700">
                    {m.lastSignInAt ? formatDateTime(m.lastSignInAt) : "Belum pernah"}
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <Link
                      href={`/team/${m.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-brand text-brand hover:bg-brand/5")}
                    >
                      Kelola
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}