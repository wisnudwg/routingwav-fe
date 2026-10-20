export function Flag({ code }: { code: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0 rounded-xs`}
      aria-hidden
    />
  )
}