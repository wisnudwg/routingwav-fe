import { ComingSoon } from "@/components/dashboard/coming-soon"

export default function TeamPage() {
  return (
    <ComingSoon
      title="Team"
      permission="team:manage"
      description="Pemilik akun akan membuat anggota tim (IAM) dan mengatur izin akses per profil di sini."
    />
  )
}