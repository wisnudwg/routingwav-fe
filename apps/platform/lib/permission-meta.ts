// permission-meta.ts
"use client"

import { useEffect, useState } from "react"
import { api, ApiError } from "./api"
import type { PermissionsMeta } from "./api-types"

let cache: PermissionsMeta | null = null
let inflight: Promise<PermissionsMeta> | null = null

export function loadPermissionMeta(): Promise<PermissionsMeta> {
  if (cache) return Promise.resolve(cache)
  inflight ??= api<PermissionsMeta>("/meta/permissions")
    .then((m) => {
      cache = m
      return m
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}

export function usePermissionMeta() {
  const [meta, setMeta] = useState<PermissionsMeta | null>(cache)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) return
    let cancelled = false
    loadPermissionMeta()
      .then((m) => {
        if (!cancelled) setMeta(m)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : "Gagal memuat daftar izin.")
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { meta, error }
}