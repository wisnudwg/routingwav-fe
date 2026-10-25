"use client"

import { useId, useRef } from "react"
import { Button } from "@workspace/ui/components/button"
import { formatBytes } from "@/lib/format"
import { DOC_SPECS, type DocKind } from "@/lib/kyc"

export function DocumentInput({
  kind,
  required,
  file,
  error,
  onChange,
}: {
  kind: DocKind
  required: boolean
  file?: File
  error?: string
  onChange: (file: File | null) => void
}) {
  const spec = DOC_SPECS[kind]
  const id = useId()
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {spec.label}
        {!required && <span className="font-normal text-slate-500"> (opsional)</span>}
      </label>
      <p className="text-xs text-slate-500">
        {spec.hint} Maks. {spec.maxMB} MB.
      </p>

      <div className="flex items-center gap-3 rounded-md border border-dashed px-3 py-2">
        <input
          ref={ref}
          id={id}
          type="file"
          accept={spec.accept.join(",")}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            e.target.value = "" // lets the same file be picked again after a rejection
            onChange(f)
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()}>
          {file ? "Ganti file" : "Pilih file"}
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
          {file ? `${file.name} (${formatBytes(file.size)})` : "Belum ada file"}
        </span>
        {file && (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-slate-500 hover:underline">
            Hapus
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}