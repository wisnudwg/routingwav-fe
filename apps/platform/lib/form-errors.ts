import type { FieldValues, Path, UseFormSetError } from "react-hook-form"

/** Puts server-side field errors onto the form. Returns true if at least one field matched. */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fields: Record<string, string> | undefined,
  known: readonly string[],
): boolean {
  let any = false
  for (const [name, message] of Object.entries(fields ?? {})) {
    if (!known.includes(name)) continue
    setError(name as Path<T>, { message })
    any = true
  }
  return any
}