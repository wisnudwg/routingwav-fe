import type { Permission } from "@/lib/permissions"
import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "./header"

export const titleFromSlug = (slug: string[]) =>
  (slug[slug.length - 1] ?? "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ") || "Halaman"

export function ComingSoon({
  title,
  description = "Halaman ini sedang dibangun.",
  permission,
}: {
  title: string
  description?: string
  permission?: Permission
}) {
  const body = (
    <div className="rounded-lg border border-dashed bg-white p-10 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  )

  return (
    <>
      <Header title={title} />
      <div className="p-6 md:p-8">
        {permission ? <PermissionGate permission={permission}>{body}</PermissionGate> : body}
      </div>
    </>
  )
}