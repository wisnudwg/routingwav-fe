"use client"

import { useEffect, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { NoOwner } from "@/components/team/team-view"
import { fetchActivity, type ActivityCategory, type ActivityEvent } from "@/lib/activity-api"
import { useSession } from "@/lib/auth"
import { formatDateTime } from "@/lib/format"

const CATEGORIES: { value: ActivityCategory; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "auth", label: "Masuk & keamanan" },
  { value: "team", label: "Tim" },
  { value: "account", label: "Akun" },
]

type State = { category: ActivityCategory; events: ActivityEvent[]; next: string | null; error: string | null }

export function ActivityLog() {
  const session = useSession()
  const isOwner = session?.type === "root"
  const [category, setCategory] = useState<ActivityCategory>("all")
  const [state, setState] = useState<State | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (!isOwner) return
    let cancelled = false
    fetchActivity(category).then((res) => {
      if (cancelled) return
      setState(
        res.ok
          ? { category, events: res.events, next: res.nextCursor, error: null }
          : { category, events: [], next: null, error: res.message },
      )
    })
    return () => {
      cancelled = true
    }
  }, [isOwner, category])

  if (session === undefined) return null
  if (!isOwner) return <NoOwner />

  const ready = state && state.category === category ? state : null

  async function loadMore() {
    if (!ready?.next) return
    setLoadingMore(true)
    const res = await fetchActivity(category, ready.next)
    setLoadingMore(false)
    setState((s) =>
      s && s.category === category
        ? res.ok
          ? { ...s, events: [...s.events, ...res.events], next: res.nextCursor, error: null }
          : { ...s, error: res.message }
        : s,
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Riwayat masuk, perubahan data akun, dan pengelolaan tim. Nilai data (password, nomor, dan sejenisnya) tidak
        pernah dicatat di sini.
      </p>

      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            aria-pressed={category === c.value}
            className={cn(
              "rounded-md px-3 py-1 text-sm text-slate-700 hover:bg-slate-100",
              category === c.value && "bg-slate-200 font-medium text-slate-900",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="text-sm text-slate-500">Memuat…</p>
      ) : (
        <>
          {ready.error && <p role="alert" className="text-sm text-destructive">{ready.error}</p>}

          {ready.events.length === 0 && !ready.error ? (
            <div className="rounded-lg border border-dashed bg-white p-10 text-center text-sm text-slate-600">
              Belum ada aktivitas.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border bg-white">
              <Table className="min-w-160">
                <TableHeader>
                  <TableRow className="text-xs uppercase tracking-wide">
                    <TableHead className="pl-4">Waktu</TableHead>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead className="pr-4">Oleh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ready.events.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap py-3 pl-4 text-sm text-slate-700">
                        {formatDateTime(e.at)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-900">{e.label}</TableCell>
                      <TableCell className="text-sm text-slate-600">{e.detail ?? "-"}</TableCell>
                      <TableCell className="pr-4 text-sm text-slate-600">{e.actor}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {ready.next && (
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Memuat…" : "Muat lebih banyak"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}