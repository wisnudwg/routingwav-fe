import { PermissionGate } from "@/components/auth/permission-gate"
import { Header } from "@/components/dashboard/header"
import { AddProfileForm } from "@/components/profile/add-profile-form"

export default function NewProfilePage() {
  return (
    <>
      <Header title="Tambah profil" />
      <div className="mx-auto max-w-2xl p-6 md:p-8">
        <PermissionGate permission="account:manage">
          <AddProfileForm />
        </PermissionGate>
      </div>
    </>
  )
}