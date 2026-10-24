"use client"

import { useEffect, useState } from "react"
import { useFormContext } from "react-hook-form"
import { Input } from "@workspace/ui/components/input"
import { isAliasWellFormed, sanitizeAlias } from "@/lib/alias"
import { checkAliasAvailable } from "@/lib/auth-api"
import { FormField } from "./form-field"

type AliasValues = { accountAlias: string }
type Status = "idle" | "checking" | "available" | "taken"

function useAliasStatus(alias: string): Status {
  const enabled = isAliasWellFormed(alias)
  const [result, setResult] = useState<{ alias: string; available: boolean } | null>(null)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const t = setTimeout(async () => {
      const available = await checkAliasAvailable(alias)
      if (!cancelled) setResult({ alias, available })
    }, 400) // debounce
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [alias, enabled])

  if (!enabled) return "idle"
  if (!result || result.alias !== alias) return "checking"
  return result.available ? "available" : "taken"
}

export function AliasField() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<AliasValues>()

  const alias = watch("accountAlias") ?? ""
  const status = useAliasStatus(alias)
  const field = register("accountAlias")

  const hint =
    status === "checking"
      ? "Memeriksa ketersediaan…"
      : status === "available"
        ? "✓ ID akun tersedia"
        : "Dipakai anggota tim untuk masuk. Huruf kecil, angka, dan tanda hubung (3–63 karakter)."

  const error =
    errors.accountAlias?.message ??
    (status === "taken" ? "ID akun sudah dipakai, coba yang lain" : undefined)

  return (
    <FormField label="ID akun (alias)" htmlFor="accountAlias" error={error} hint={hint}>
      <Input
        id="accountAlias"
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        placeholder="mis. studio-abc"
        aria-invalid={!!error}
        {...field}
        onChange={(e) => {
          e.target.value = sanitizeAlias(e.target.value)
          field.onChange(e)
        }}
      />
    </FormField>
  )
}