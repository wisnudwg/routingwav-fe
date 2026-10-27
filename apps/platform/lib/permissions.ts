import type { Session } from "./auth"
import type { ProfileKind } from "./roles"

export type PermissionScope = ProfileKind | "shared"

export type PermissionDef = {
  scope: PermissionScope
  /** Heading shown above a run of related permissions */
  group?: string
  label: string
  description: string
  /** Granting this also grants these. Revoking one of these also revokes this. */
  requires?: readonly string[]
  /** Legally or financially significant: highlighted in the editor */
  sensitive?: boolean
  /** Only the account owner can hold it. Never grantable to an IAM user. */
  rootOnly?: boolean
}

export const CATALOG = {
  /* ---------- Talent ---------- */
  "mode:talent": {
    scope: "talent",
    label: "Akses area Talent",
    description: "Boleh masuk ke area Talent. Izin Talent lainnya hanya berlaku bila ini aktif.",
  },
  "talent:dashboard.view": {
    scope: "talent", group: "Dashboard", requires: ["mode:talent"],
    label: "Lihat Dashboard", description: "Melihat ringkasan dashboard Talent.",
  },
  "talent:products.view": {
    scope: "talent", group: "Produk", requires: ["mode:talent"],
    label: "Lihat produk", description: "Melihat daftar produk dan layanan.",
  },
  "talent:products.manage": {
    scope: "talent", group: "Produk", requires: ["talent:products.view"],
    label: "Kelola produk", description: "Menambah, mengubah, dan menghapus produk atau layanan.",
  },
  "talent:store.manage": {
    scope: "talent", group: "Store", requires: ["mode:talent"],
    label: "Kelola Store Builder", description: "Mengubah tampilan dan isi toko publik.",
  },
  "talent:studio.view": {
    scope: "talent", group: "Studio Manager", requires: ["mode:talent"],
    label: "Lihat Studio Manager", description: "Melihat proposal dan pekerjaan yang masuk.",
  },
  "talent:studio.manage": {
    scope: "talent", group: "Studio Manager", requires: ["talent:studio.view"], sensitive: true,
    label: "Tanggapi & kerjakan pesanan",
    description: "Menerima atau menolak proposal, mengirim file hasil kerja, dan menangani revisi.",
  },
  "talent:sales.view": {
    scope: "talent", group: "Sales & Orders", requires: ["mode:talent"],
    label: "Lihat Sales & Orders", description: "Melihat riwayat penjualan, pesanan, dan nominalnya.",
  },

  /* ---------- Client (provisional until the Client workflow is defined) ---------- */
  "mode:client": {
    scope: "client",
    label: "Akses area Client",
    description: "Boleh masuk ke area Client. Izin Client lainnya hanya berlaku bila ini aktif.",
  },
  "client:dashboard.view": {
    scope: "client", group: "Dashboard", requires: ["mode:client"],
    label: "Lihat Dashboard", description: "Melihat ringkasan dashboard Client.",
  },
  "client:talent.browse": {
    scope: "client", group: "Cari Talent", requires: ["mode:client"],
    label: "Cari & lihat talent", description: "Menelusuri talent dan melihat profilnya.",
  },
  "client:projects.view": {
    scope: "client", group: "Proyek", requires: ["mode:client"],
    label: "Lihat proyek", description: "Melihat daftar proyek dan statusnya.",
  },
  "client:projects.manage": {
    scope: "client", group: "Proyek", requires: ["client:projects.view"], sensitive: true,
    label: "Kelola proyek",
    description: "Membuat, mengubah, dan menerbitkan proyek, serta mengirim proposal kerja ke talent.",
  },
  "client:orders.view": {
    scope: "client", group: "Orders & Payments", requires: ["mode:client"],
    label: "Lihat pesanan & pembayaran", description: "Melihat pesanan dan riwayat pembayaran.",
  },
  "client:payments.pay": {
    scope: "client", group: "Orders & Payments", requires: ["client:orders.view"], sensitive: true,
    label: "Lakukan pembayaran", description: "Membayar pesanan dan melepas dana escrow.",
  },

  /* ---------- Shared ---------- */
  "messages:view": {
    scope: "shared", group: "Pesan",
    label: "Lihat pesan", description: "Membaca percakapan dan mendengarkan file audio.",
  },
  "messages:send": {
    scope: "shared", group: "Pesan", requires: ["messages:view"],
    label: "Kirim pesan & file", description: "Membalas pesan dan mengirim file audio (mp3/wav).",
  },
  "files:download": {
    scope: "shared", group: "Pesan", requires: ["messages:view"], sensitive: true,
    label: "Unduh file audio",
    description: "Mengunduh file audio dari percakapan. File hasil kerja dari pihak lain baru bisa diunduh setelah kontrak selesai dan dibayar.",
  },
  "wallet:view": {
    scope: "shared", group: "Wallet",
    label: "Lihat Wallet", description: "Melihat saldo dan riwayat transaksi.",
  },
  "wallet:withdraw": {
    scope: "shared", group: "Wallet", requires: ["wallet:view", "approvals:view"], sensitive: true,
    label: "Ajukan penarikan saldo",
    description: "Mengajukan penarikan ke rekening terdaftar. Selalu memerlukan persetujuan pemilik akun atau delegasi.",
  },
  "approvals:view": {
    scope: "shared", group: "Persetujuan",
    label: "Lihat persetujuan",
    description: "Melihat status permintaan sendiri. Bila didelegasikan pemilik akun, juga bisa memutuskan permintaan tertentu.",
  },
  "contracts:sign": {
    scope: "shared", group: "Kontrak", requires: ["approvals:view"], sensitive: true,
    label: "Tandatangani kontrak",
    description: "Menandatangani kontrak atas nama akun. Hanya untuk perwakilan yang ditunjuk, dan memerlukan persetujuan.",
  },

  /* ---------- Owner only: never grantable ---------- */
  "team:manage": {
    scope: "shared", group: "Tim", rootOnly: true,
    label: "Kelola tim", description: "Membuat anggota tim dan mengatur izin mereka.",
  },
  "account:manage": {
    scope: "shared", group: "Akun", rootOnly: true,
    label: "Kelola akun", description: "Profil, pengaturan akun, dan verifikasi identitas.",
  },
  "identity:reveal": {
    scope: "shared", group: "Identitas", rootOnly: true, sensitive: true,
    label: "Lihat data identitas",
    description: "Menampilkan nomor dan dokumen KTP/NIB/NPWP. Hanya pemilik akun, dan selalu dicatat.",
  },
  "activity:view": {
    scope: "shared", group: "Akun", rootOnly: true,
    label: "Lihat log aktivitas",
    description: "Melihat riwayat akses dan perubahan data sensitif.",
  },
} as const satisfies Record<string, PermissionDef>

export type Permission = keyof typeof CATALOG

export const PERMISSIONS = Object.keys(CATALOG) as Permission[]

export const isPermission = (x: unknown): x is Permission =>
  typeof x === "string" && Object.hasOwn(CATALOG, x)

export const defOf = (p: Permission): PermissionDef => CATALOG[p]
export const isRootOnly = (p: Permission) => defOf(p).rootOnly === true

const requiresOf = (p: Permission): Permission[] => (defOf(p).requires ?? []).filter(isPermission)

/** Grantable permissions of one scope, in catalog order */
export const permissionsOfScope = (scope: PermissionScope): Permission[] =>
  PERMISSIONS.filter((p) => defOf(p).scope === scope && !isRootOnly(p))

function addWithRequires(set: Set<Permission>, p: Permission) {
  set.add(p)
  for (const r of requiresOf(p)) if (!set.has(r)) addWithRequires(set, r)
}

/** Add a permission together with everything it depends on */
export function grant(current: readonly Permission[], id: Permission): Permission[] {
  const set = new Set(current)
  addWithRequires(set, id)
  return PERMISSIONS.filter((p) => set.has(p))
}

/** Remove a permission and everything that depends on it */
export function revoke(current: readonly Permission[], id: Permission): Permission[] {
  const set = new Set(current)
  set.delete(id)
  let changed = true
  while (changed) {
    changed = false
    for (const p of [...set]) {
      if (requiresOf(p).some((r) => !set.has(r))) {
        set.delete(p)
        changed = true
      }
    }
  }
  return PERMISSIONS.filter((p) => set.has(p))
}

/** Drop unknown and owner-only entries, add missing dependencies, use catalog order */
export function normalizePermissions(input: readonly unknown[]): Permission[] {
  const set = new Set<Permission>()
  for (const p of input) if (isPermission(p) && !isRootOnly(p)) addWithRequires(set, p)
  return PERMISSIONS.filter((p) => set.has(p))
}

/** Drop permissions of profiles the account doesn't have */
export function limitToProfiles(
  perms: readonly Permission[],
  profiles: readonly ProfileKind[]
): Permission[] {
  return perms.filter((p) => {
    const scope = defOf(p).scope
    return scope === "shared" || profiles.includes(scope)
  })
}

export const modePermission = (k: ProfileKind): Permission =>
  k === "talent" ? "mode:talent" : "mode:client"

export function can(s: Session, p: Permission): boolean {
  if (s.type === "root") return true
  return !isRootOnly(p) && s.permissions.includes(p)
}

/** Profiles the signed-in user may actually enter */
export function availableModes(s: Session): ProfileKind[] {
  return s.profiles.filter((k) => can(s, modePermission(k)))
}

/* ---------- Presets (quick starting points in the editor) ---------- */

const VIEWER: Permission[] = [
  "mode:talent", "talent:dashboard.view", "talent:products.view", "talent:studio.view", "talent:sales.view",
  "mode:client", "client:dashboard.view", "client:talent.browse", "client:projects.view", "client:orders.view",
  "messages:view",
]

export const PRESETS: {
  id: string
  label: string
  description: string
  permissions: Permission[]
}[] = [
  { id: "viewer", label: "Hanya lihat", description: "Melihat data tanpa mengubah apa pun.", permissions: VIEWER },
  {
    id: "operator",
    label: "Operasional",
    description: "Mengelola pekerjaan harian, tanpa akses keuangan.",
    permissions: [
      ...VIEWER,
      "talent:products.manage", "talent:store.manage", "talent:studio.manage",
      "client:projects.manage", "messages:send", "files:download",
    ],
  },
  {
    id: "finance",
    label: "Keuangan",
    description: "Melihat penjualan, pesanan, dan Wallet (tanpa tarik saldo atau bayar).",
    permissions: ["mode:talent", "talent:sales.view", "mode:client", "client:orders.view", "wallet:view"],
  },
]