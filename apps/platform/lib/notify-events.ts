import { ACTION_INFO, type ApprovalRequest } from "./approvals"
import { approvalsStore } from "./approvals-store"
import { formatIDR } from "./format"
import { notify } from "./notify"
import type { ProfileKind } from "./roles"

/** Who may decide a pending request: the owner plus covering delegates (never the requester) */
function deciders(req: ApprovalRequest): string[] {
  const delegates = approvalsStore
    .delegations(req.account)
    .filter(
      (d) =>
        d.types.includes(req.type) &&
        (d.requesters === "all" || d.requesters.includes(req.requestedBy)) &&
        d.username !== req.requestedBy
    )
    .map((d) => d.username)
  return ["owner", ...delegates]
}

export function approvalRequested(req: ApprovalRequest) {
  notify({
    account: req.account,
    category: "approvals",
    to: deciders(req),
    by: req.requestedBy,
    title: `Permintaan baru: ${ACTION_INFO[req.type].label}`,
    body: `${req.requestedByLabel}: ${req.summary}`,
    url: "/approvals",
    tag: `approval-${req.id}`,
  })
}

export function approvalDecided(req: ApprovalRequest, byKey: string) {
  const title =
    req.status === "approved"
      ? "Permintaan Anda disetujui"
      : req.status === "failed"
        ? "Permintaan disetujui, tetapi gagal diproses"
        : "Permintaan Anda ditolak"

  notify({
    account: req.account,
    category: "approvals",
    to: [req.requestedBy],
    by: byKey,
    title,
    body: [req.summary, req.note && `Catatan: ${req.note}`, req.failReason && `Gagal: ${req.failReason}`]
      .filter(Boolean)
      .join(" · "),
    url: "/approvals",
    tag: `approval-${req.id}`,
  })
}

export function withdrawalProcessed(p: {
  account: string
  fee: number
  net: number
  bankLabel: string
  by: string
  requestedBy?: string
}) {
  notify({
    account: p.account,
    category: "finance",
    to: ["owner", ...(p.requestedBy ? [p.requestedBy] : [])],
    by: p.by,
    title: "Penarikan sedang diproses",
    body: `${formatIDR(p.net)} akan masuk ke ${p.bankLabel} dalam 1×24 jam (biaya ${formatIDR(p.fee)}).`,
    url: "/wallet",
  })
}

export function withdrawalSettled(account: string, net: number, bankLabel: string) {
  notify({
    account,
    category: "finance",
    to: ["owner"],
    title: "Dana terkirim ke rekening",
    body: `${formatIDR(net)} telah dikirim ke ${bankLabel}.`,
    url: "/wallet",
  })
}

export function bankChanged(account: string, change: "added" | "removed", bankLabel: string, byKey: string) {
  notify({
    account,
    category: "account",
    to: ["owner"],
    by: byKey,
    title: change === "added" ? "Rekening bank ditambahkan" : "Rekening bank dihapus",
    body: `${bankLabel}. Jika bukan Anda yang melakukannya, segera ganti password dan tinjau Log aktivitas.`,
    url: "/wallet",
  })
}

export function delegationChanged(account: string, username: string, change: "saved" | "removed") {
  const saved = change === "saved"
  notify({
    account,
    category: "account",
    to: ["owner"],
    by: "owner",
    title: saved ? "Delegasi persetujuan disimpan" : "Delegasi persetujuan dicabut",
    body: `Penerima: ${username}.`,
    url: "/team/delegation",
  })
  notify({
    account,
    category: "account",
    to: [username],
    by: "owner",
    title: saved ? "Anda diberi delegasi persetujuan" : "Delegasi persetujuan Anda dicabut",
    body: saved ? "Anda kini bisa memutuskan permintaan tertentu di halaman Approvals." : "Anda tidak lagi bisa memutuskan permintaan anggota lain.",
    url: "/approvals",
  })
}

export function representativeChanged(
  account: string,
  kind: ProfileKind,
  username: string,
  change: "set" | "revoked"
) {
  const profile = kind === "talent" ? "Talent" : "Client"
  const set = change === "set"
  notify({
    account,
    category: "account",
    to: ["owner"],
    by: "owner",
    title: set ? "Perwakilan ditunjuk" : "Penunjukan perwakilan dicabut",
    body: `Profil ${profile}: ${username}.`,
    url: "/account/representative",
  })
  notify({
    account,
    category: "account",
    to: [username],
    by: "owner",
    title: set ? `Anda ditunjuk sebagai perwakilan ${profile}` : `Penunjukan perwakilan ${profile} dicabut`,
    body: set ? "Anda kini dapat menandatangani kontrak atas nama akun (dengan persetujuan)." : "Anda tidak lagi dapat menandatangani kontrak atas nama akun.",
    url: "/approvals",
  })
}

export function kycDecided(account: string, decision: "verified" | "rejected") {
  notify({
    account,
    category: "account",
    to: ["owner"],
    title: decision === "verified" ? "Identitas Anda terverifikasi" : "Verifikasi identitas ditolak",
    body:
      decision === "verified"
        ? "Anda kini dapat menambah rekening bank dan menarik saldo."
        : "Perbarui data Anda lalu ajukan kembali.",
    url: "/account/verification",
  })
}