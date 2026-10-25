"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"
import { FormField } from "@/components/auth/form-field"
import type { Permission } from "@/lib/permissions"
import type { TeamMember } from "@/lib/team"
import { createTeamMember } from "@/lib/team-api"
import { useOwner } from "@/lib/use-owner"
import { createMemberSchema, type CreateMemberValues } from "@/lib/validators"
import { CredentialsCard } from "./credentials-card"
import { PermissionEditor } from "./permission-editor"
import { NoOwner } from "./team-view"

export function MemberCreate() {
  const owner = useOwner()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [created, setCreated] = useState<{ member: TeamMember; tempPassword: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateMemberValues>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: { username: "", displayName: "" },
  })

  if (owner === undefined) return null
  if (owner === null) return <NoOwner />

  async function onSubmit(v: CreateMemberValues) {
    if (!owner) return
    const res = await createTeamMember(owner, {
      username: v.username,
      displayName: v.displayName,
      permissions,
    })
    if (!res.ok) return setError("username", { message: res.message })
    setCreated(res.data)
  }

  if (created) {
    return (
      <div className="space-y-4">
        <CredentialsCard
          account={owner.alias}
          username={created.member.username}
          password={created.tempPassword}
        />
        <div className="flex flex-wrap gap-2">
          <Link href="/team" className={cn(buttonVariants())}>Selesai</Link>
          <Button
            variant="outline"
            onClick={() => {
              setCreated(null)
              setPermissions([])
              reset()
            }}
          >
            Tambah anggota lain
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <Link href="/team" className="text-sm text-brand hover:underline">← Kembali ke Team</Link>

      <section className="space-y-4 rounded-lg border bg-white p-4 md:p-6">
        <h2 className="font-medium text-slate-900">Anggota baru</h2>

        <FormField
          label="Username"
          htmlFor="username"
          error={errors.username?.message}
          hint="Dipakai untuk masuk, tidak bisa diubah nanti."
        >
          <Input
            id="username"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!errors.username}
            {...register("username")}
          />
        </FormField>

        <FormField label="Nama tampilan (opsional)" htmlFor="displayName" error={errors.displayName?.message}>
          <Input id="displayName" autoComplete="off" aria-invalid={!!errors.displayName} {...register("displayName")} />
        </FormField>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium text-slate-900">Izin akses</h2>
        <PermissionEditor value={permissions} onChange={setPermissions} profiles={owner.profiles} />
      </section>

      <Button type="submit" disabled={isSubmitting}>
        Buat anggota &amp; buat password sementara
      </Button>
    </form>
  )
}