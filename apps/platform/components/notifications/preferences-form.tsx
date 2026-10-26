"use client"

import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { requesterKey } from "@/lib/approvals"
import { CATEGORIES, CATEGORY_INFO, type Category, type Channel, type Prefs } from "@/lib/notifications"
import { getPrefs, savePrefs } from "@/lib/notifications-api"
import { useActor } from "@/lib/use-actor"

export function PreferencesForm() {
  const actor = useActor()
  const alias = actor?.alias
  const user = actor ? requesterKey(actor) : undefined
  const [state, setState] = useState<{ key: string; prefs: Prefs } | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!alias || !user) return
    let cancelled = false
    getPrefs(alias, user).then((prefs) => {
      if (!cancelled) setState({ key: `${alias}:${user}`, prefs })
    })
    return () => {
      cancelled = true
    }
  }, [alias, user])

  if (!actor || !alias || !user) return null
  if (!state || state.key !== `${alias}:${user}`) return <p className="text-sm text-slate-500">Memuat…</p>

  const prefs = state.prefs
  const canEmail = actor.kind === "root"

  const toggle = async (category: Category, channel: Channel) => {
    const next: Prefs = { ...prefs, [category]: { ...prefs[category], [channel]: !prefs[category][channel] } }
    setSaved(false)
    setState({ key: state.key, prefs: next })
    const confirmed = await savePrefs(alias, user, next) // the server enforces the locks
    setState({ key: state.key, prefs: confirmed })
    setSaved(true)
  }

  return (
    <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-medium text-slate-900">Jenis notifikasi</h2>
        {saved && <span role="status" className="text-xs text-green-700">Tersimpan</span>}
      </div>

      <p className="text-xs leading-relaxed text-slate-600">
        {canEmail
          ? "Email dikirim ke alamat email akun Anda."
          : "Akun anggota tim tidak memiliki alamat email, sehingga notifikasi email tidak tersedia. Anda tetap menerima notifikasi di aplikasi dan push."}
      </p>

      <div className="divide-y">
        {CATEGORIES.map((c) => {
          const info = CATEGORY_INFO[c]
          return (
            <fieldset key={c} className="space-y-3 py-4 first:pt-0 last:pb-0">
              <legend className="sr-only">{info.label}</legend>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                  {info.label}
                  {info.locked && <Lock className="size-3.5 text-slate-500" aria-label="Tidak bisa dimatikan" />}
                </p>
                <p className="text-xs text-slate-600">{info.description}</p>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-800">
                <label className="flex items-center gap-2 opacity-60">
                  <input type="checkbox" checked disabled className="size-4 accent-brand" />
                  Di aplikasi
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prefs[c].push}
                    disabled={info.locked}
                    onChange={() => toggle(c, "push")}
                    className="size-4 accent-brand"
                  />
                  Push
                </label>
                <label className={canEmail ? "flex items-center gap-2" : "flex items-center gap-2 opacity-60"}>
                  <input
                    type="checkbox"
                    checked={canEmail && prefs[c].email}
                    disabled={info.locked || !canEmail}
                    onChange={() => toggle(c, "email")}
                    className="size-4 accent-brand"
                  />
                  Email
                </label>
              </div>
            </fieldset>
          )
        })}
      </div>
    </section>
  )
}