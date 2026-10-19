export function Flag({ code }: { code: string }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()} shrink-0 rounded-[2px]`}
      aria-hidden
    />
  )
}