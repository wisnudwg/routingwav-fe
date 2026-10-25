"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { NoOwner } from "@/components/team/team-view"
import { AUDIT_LABEL, fetchEvents, type AuditEvent } from "@/lib/audit"
import { useSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"

export function ActivityLog() {
  const session = useSession()
  const alias = session?.type === "root" ? session.alias : undefined
  const [events, setEvents] = useState<AuditEvent[] | null>(null)

  useEffect(() => {
    if (!alias) return
    let cancelled = false
    fetchEvents(alias).then((e) => {
      if (!cancelled) setEvents(e)
    })
    return () => {
      cancelled = true
    }
  }, [alias])

  if (session === undefined) return null
  if (!alias) return <NoOwner />
  if (events === null) return <p className="text-sm text-slate-500">Memuat…</p>

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Riwayat perubahan data akun dan akses ke data identitas. Nilai data tidak pernah dicatat di sini.
      </p>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-10 text-center text-sm text-slate-600">
          Belum ada aktivitas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <Table className="min-w-[40rem]">
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide">
                <TableHead className="pl-4">Waktu</TableHead>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead className="pr-4">Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap py-3 pl-4 text-sm text-slate-700">
                    {formatDateTime(e.at)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-900">{AUDIT_LABEL[e.action]}</TableCell>
                  <TableCell className="text-sm text-slate-600">{e.detail ?? "-"}</TableCell>
                  <TableCell className="pr-4 text-sm text-slate-600">{e.actor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}