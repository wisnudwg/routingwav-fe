"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { FormField } from "@/components/auth/form-field"
import { ServerError } from "@/components/auth/server-error"
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_INFO,
  DOCS_BY_TYPE,
  ENTITY_TYPES,
  digitsOnly,
  emptyKycForm,
  kycSchema,
  validateFile,
  type DocKind,
  type DocMeta,
  type KycFormValues,
  type KycSummary,
} from "@/lib/kyc"
import { submitKyc } from "@/lib/kyc-api"
import { DocumentInput } from "./document-input"
import { MockNotice } from "./mock-notice"
import { nikLooksUnusual } from "@/lib/kyc"

type DigitField = "nik" | "npwp" | "nib" | "repNik"

function nikHint(value: string) {
  if (value.length === 0) return "16 digit sesuai KTP"
  if (value.length < 16) return `${value.length}/16 digit`
  return nikLooksUnusual(value)
    ? "Tanggal lahir pada NIK ini tidak lazim. Pastikan sudah sesuai KTP Anda."
    : "✓ 16 digit"
}

export function KycForm({
  alias,
  actor,
  initial,
  onSubmitted,
  onCancel,
}: {
  alias: string
  actor: string
  initial?: KycSummary
  onSubmitted: () => void
  onCancel?: () => void
}) {
  const [files, setFiles] = useState<Partial<Record<DocKind, File>>>({})
  const [fileErrors, setFileErrors] = useState<Partial<Record<DocKind, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      ...emptyKycForm(),
      type: initial?.type ?? "individual",
      // Names are prefilled. Numbers are never sent back to the browser: re-enter them.
      fullName: initial?.names.fullName ?? "",
      entityType: initial?.names.entityType ?? "",
      legalName: initial?.names.legalName ?? "",
      repName: initial?.names.repName ?? "",
    },
  })

  const type = watch("type")

  function digits(name: DigitField, max: number) {
    const field = register(name)
    return {
      ...field,
      inputMode: "numeric" as const,
      autoComplete: "off",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        e.target.value = digitsOnly(e.target.value, max)
        return field.onChange(e)
      },
    }
  }

  function pickFile(kind: DocKind, file: File | null) {
    if (!file) {
      setFiles((f) => ({ ...f, [kind]: undefined }))
      setFileErrors((e) => ({ ...e, [kind]: undefined }))
      return
    }
    const problem = validateFile(file, kind)
    setFileErrors((e) => ({ ...e, [kind]: problem ?? undefined }))
    if (!problem) setFiles((f) => ({ ...f, [kind]: file }))
  }

  async function onSubmit(values: KycFormValues) {
    setServerError(null)

    const docs: Partial<Record<DocKind, DocMeta>> = {}
    const missing: Partial<Record<DocKind, string>> = {}
    for (const { kind, required } of DOCS_BY_TYPE[values.type]) {
      const f = files[kind]
      if (f) docs[kind] = { name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() }
      else if (required) missing[kind] = "Dokumen wajib diunggah"
    }
    setFileErrors(missing)
    if (Object.keys(missing).length > 0) return

    // TODO (real backend): request presigned URLs, upload the files to private storage,
    // then submit the metadata. Files never pass through this app's server.
    const res = await submitKyc(alias, actor, { values, docs })
    if (!res.ok) return setServerError(res.message)
    onSubmitted()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <MockNotice />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-800">Jenis akun</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ACCOUNT_TYPES.map((t) => (
            <label
              key={t}
              className={cn(
                "cursor-pointer rounded-lg border p-3 transition-colors hover:bg-slate-50",
                "has-checked:border-brand has-checked:bg-brand/5",
                "has-focus-visible:ring-2 has-focus-visible:ring-brand/40"
              )}
            >
              <input
                type="radio"
                name="kyc-type"
                value={t}
                checked={type === t}
                onChange={() => setValue("type", t)}
                className="sr-only"
              />
              <span className="block font-medium text-slate-900">{ACCOUNT_TYPE_INFO[t].title}</span>
              <span className="mt-1 block text-xs leading-snug text-slate-600">{ACCOUNT_TYPE_INFO[t].desc}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "individual" ? (
        <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
          <h2 className="font-medium text-slate-900">Data perorangan</h2>
          <FormField label="Nama sesuai KTP" htmlFor="fullName" error={errors.fullName?.message}>
            <Input id="fullName" autoComplete="off" aria-invalid={!!errors.fullName} {...register("fullName")} />
          </FormField>
          <FormField label="NIK (16 digit)" htmlFor="nik" error={errors.nik?.message} hint={nikHint(watch("nik"))}>
            <Input id="nik" aria-invalid={!!errors.nik} {...digits("nik", 16)} />
          </FormField>
          <FormField
            label="NPWP (opsional)"
            htmlFor="npwp"
            error={errors.npwp?.message}
            hint="15 atau 16 digit. Perlakuan pajak bisa berbeda bila tanpa NPWP, tanyakan ke penasihat pajak Anda."
          >
            <Input id="npwp" aria-invalid={!!errors.npwp} {...digits("npwp", 16)} />
          </FormField>
        </section>
      ) : (
        <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
          <h2 className="font-medium text-slate-900">Data badan usaha</h2>

          <FormField label="Jenis badan usaha" htmlFor="entityType" error={errors.entityType?.message}>
            <select
              id="entityType"
              aria-invalid={!!errors.entityType}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive"
              {...register("entityType")}
            >
              <option value="">Pilih jenis</option>
              {ENTITY_TYPES.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Nama badan usaha" htmlFor="legalName" error={errors.legalName?.message}>
            <Input id="legalName" autoComplete="off" aria-invalid={!!errors.legalName} {...register("legalName")} />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="NIB (13 digit)" htmlFor="nib" error={errors.nib?.message}>
              <Input id="nib" aria-invalid={!!errors.nib} {...digits("nib", 13)} />
            </FormField>
            <FormField label="NPWP perusahaan" htmlFor="npwp" error={errors.npwp?.message} hint="15 atau 16 digit">
              <Input id="npwp" aria-invalid={!!errors.npwp} {...digits("npwp", 16)} />
            </FormField>
          </div>

          <h3 className="pt-2 text-sm font-medium text-slate-900">Penanggung jawab</h3>
          <FormField label="Nama sesuai KTP" htmlFor="repName" error={errors.repName?.message}>
            <Input id="repName" autoComplete="off" aria-invalid={!!errors.repName} {...register("repName")} />
          </FormField>
          <FormField label="NIK (16 digit)" htmlFor="repNik" error={errors.repNik?.message} hint={nikHint(watch("nik"))}>
            <Input id="repNik" aria-invalid={!!errors.repNik} {...digits("repNik", 16)} />
          </FormField>
        </section>
      )}

      <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
        <h2 className="font-medium text-slate-900">Dokumen</h2>
        {DOCS_BY_TYPE[type].map(({ kind, required }) => (
          <DocumentInput
            key={kind}
            kind={kind}
            required={required}
            file={files[kind]}
            error={fileErrors[kind]}
            onChange={(f) => pickFile(kind, f)}
          />
        ))}
      </section>

      <div className="space-y-1.5">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5 size-4 accent-brand" {...register("consent")} />
          <span>
            Saya menyatakan data di atas benar dan menyetujui pemrosesan data identitas saya untuk
            verifikasi sesuai Kebijakan Privasi.
          </span>
        </label>
        {errors.consent?.message && (
          <p role="alert" className="text-xs text-destructive">{errors.consent.message}</p>
        )}
      </div>

      <ServerError message={serverError} />

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>Ajukan verifikasi</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>Batal</Button>
        )}
      </div>
    </form>
  )
}