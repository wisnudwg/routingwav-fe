"use client"

import Link from "next/link"
import { useFormContext } from "react-hook-form"

export function TermsCheckbox() {
  const {
    register,
    formState: { errors },
  } = useFormContext<{ acceptTerms: boolean }>()

  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-0.5 size-4 accent-brand" {...register("acceptTerms")} />
        <span>
          Saya menyetujui{" "}
          <Link href="/legal/terms" target="_blank" className="text-brand hover:underline">
            Syarat &amp; Ketentuan
          </Link>{" "}
          dan{" "}
          <Link href="/legal/privacy" target="_blank" className="text-brand hover:underline">
            Kebijakan Privasi
          </Link>
          .
        </span>
      </label>
      {errors.acceptTerms?.message && (
        <p role="alert" className="text-xs text-destructive">{errors.acceptTerms.message}</p>
      )}
    </div>
  )
}