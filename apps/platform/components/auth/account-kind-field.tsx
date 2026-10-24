"use client"

import { useFormContext } from "react-hook-form"
import { cn } from "@workspace/ui/lib/utils"
import { KIND_INFO, PROFILE_KINDS, type ProfileKind } from "@/lib/roles"
import type { ProfileValues } from "@/lib/validators"

export function AccountKindField() {
  const {
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useFormContext<ProfileValues>()
  const kind = watch("kind")

  function choose(next: ProfileKind) {
    if (next === kind) return
    setValue("kind", next, { shouldValidate: isSubmitted, shouldDirty: true })
    // The role lists differ per kind, so start fresh
    setValue("roles", [])
    setValue("otherRole", "")
    setValue("instruments", "")
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-slate-800">Saya mendaftar sebagai</legend>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROFILE_KINDS.map((k) => (
          <label
            key={k}
            className={cn(
              "cursor-pointer rounded-lg border p-3 transition-colors hover:bg-slate-50",
              "has-checked:border-brand has-checked:bg-brand/5",
              "has-focus-visible:ring-2 has-focus-visible:ring-brand/40"
            )}
          >
            <input
              type="radio"
              name="account-kind"
              value={k}
              checked={kind === k}
              onChange={() => choose(k)}
              className="sr-only"
            />
            <span className="block font-medium text-slate-900">{KIND_INFO[k].title}</span>
            <span className="mt-1 block text-xs leading-snug text-slate-600">{KIND_INFO[k].desc}</span>
          </label>
        ))}
      </div>

      {errors.kind?.message ? (
        <p role="alert" className="text-xs text-destructive">{errors.kind.message}</p>
      ) : (
        <p className="text-xs text-slate-500">
          Anda bisa menambahkan profil lainnya nanti tanpa mendaftar ulang.
        </p>
      )}
    </fieldset>
  )
}