export function MockNotice() {
  if (process.env.NODE_ENV === "production") return null
  return (
    <p className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      Mode pengembangan: data disimpan di browser ini (localStorage) hanya untuk uji coba. Gunakan
      data <strong>fiktif</strong>, jangan data identitas asli.
    </p>
  )
}