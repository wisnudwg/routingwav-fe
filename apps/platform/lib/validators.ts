import { z } from "zod"
import { ALIAS_REGEX, ALIAS_REGEX_I, RESERVED_ALIASES } from "./alias"
import { OTHER_ROLE, PROFILE_KINDS, ROLES_BY_KIND, SESSION_PLAYER_ROLE, type ProfileKind } from "./roles"

const emailField = z.string().trim().email("Email tidak valid")

// One place to tighten the password policy later (applies to register, reset, change)
export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .max(128, "Password maksimal 128 karakter")

export const accountAliasSchema = z
  .string()
  .regex(ALIAS_REGEX, "3–63 karakter: huruf kecil, angka, tanda hubung (bukan di awal/akhir)")
  .refine((v) => !RESERVED_ALIASES.has(v), "ID akun ini tidak tersedia")

const acceptTerms = z
  .boolean()
  .refine((v) => v === true, "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi")

/* ---------- sign-in ---------- */

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password wajib diisi"),
})
export type SignInValues = z.infer<typeof signInSchema>

export const iamSignInSchema = z.object({
  account: z
    .string()
    .trim()
    .regex(ALIAS_REGEX_I, "ID akun/alias: 3–63 karakter (huruf, angka, tanda hubung)"),
  username: z.string().trim().min(1, "Username wajib diisi").max(64, "Maksimal 64 karakter"),
  password: z.string().min(1, "Password wajib diisi"),
  remember: z.boolean(),
})
export type IamSignInValues = z.infer<typeof iamSignInSchema>

/* ---------- profile (shared by register + complete-profile) ---------- */

const contactShape = {
  phoneCountry: z.string().min(1, "Pilih kode negara"),
  phoneNumber: z.string().regex(/^\d{6,15}$/, "Nomor telepon harus 6–15 digit"),
  country: z.string().min(1, "Pilih negara"),
  address: z.string().trim().min(5, "Alamat terlalu pendek"),
}

const roleShape = {
  kind: z.enum(PROFILE_KINDS, { error: "Pilih jenis akun" }),
  roles: z.array(z.string()).min(1, "Pilih minimal satu peran"),
  otherRole: z.string().trim().optional(),
  instruments: z.string().trim().optional(),
}

const profileShape = { ...contactShape, ...roleShape }

type Issue = { path: string; message: string }

function profileIssues(v: {
  kind: ProfileKind
  roles: string[]
  otherRole?: string
  instruments?: string
}): Issue[] {
  const issues: Issue[] = []
  const allowed = ROLES_BY_KIND[v.kind]

  if (v.roles.some((r) => !allowed.includes(r))) {
    issues.push({ path: "roles", message: "Peran tidak sesuai dengan jenis akun" })
  }
  if (v.roles.includes(OTHER_ROLE) && !v.otherRole) {
    issues.push({ path: "otherRole", message: "Tuliskan peran Anda" })
  }
  if (v.kind === "talent" && v.roles.includes(SESSION_PLAYER_ROLE) && !v.instruments) {
    issues.push({ path: "instruments", message: "Tuliskan instrumen Anda" })
  }
  return issues
}

export const profileSchema = z.object(profileShape).superRefine((v, ctx) => {
  for (const i of profileIssues(v)) {
    ctx.addIssue({ code: "custom", path: [i.path], message: i.message })
  }
})
export type ProfileValues = z.infer<typeof profileSchema>

/* ---------- register (root user) ---------- */

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    email: emailField,
    password: passwordSchema,
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
    accountAlias: accountAliasSchema,
    acceptTerms,
    ...profileShape,
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirm_password) {
      ctx.addIssue({ code: "custom", path: ["confirm_password"], message: "Password tidak sama" })
    }
    for (const i of profileIssues(v)) {
      ctx.addIssue({ code: "custom", path: [i.path], message: i.message })
    }
  })
export type RegisterValues = z.infer<typeof registerSchema>

/* ---------- complete profile (Google sign-ups) ---------- */

export const completeProfileSchema = z
  .object({
    accountAlias: accountAliasSchema,
    acceptTerms,
    ...profileShape,
  })
  .superRefine((v, ctx) => {
    for (const i of profileIssues(v)) {
      ctx.addIssue({ code: "custom", path: [i.path], message: i.message })
    }
  })
export type CompleteProfileValues = z.infer<typeof completeProfileSchema>

/* ---------- forgot / reset / change password ---------- */

export const forgotPasswordSchema = z.object({ email: emailField })
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Password tidak sama",
  })
export type NewPasswordValues = z.infer<typeof newPasswordSchema>

// Same shape, kept under both names so existing imports keep working
export const resetPasswordSchema = newPasswordSchema
export const changePasswordSchema = newPasswordSchema
export type ResetPasswordValues = NewPasswordValues

/* ---------- add another profile (signed-in owner) ---------- */

export const addProfileSchema = z.object(roleShape).superRefine((v, ctx) => {
  for (const i of profileIssues(v)) {
    ctx.addIssue({ code: "custom", path: [i.path], message: i.message })
  }
})
export type AddProfileValues = z.infer<typeof addProfileSchema>

export type RoleValues = Pick<ProfileValues, "kind" | "roles" | "otherRole" | "instruments">
export type ContactValues = Pick<ProfileValues, "phoneCountry" | "phoneNumber" | "country" | "address">

/* ---------- team members (IAM users) ---------- */

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9._-]{2,31}$/,
    "3–32 karakter: huruf, angka, titik, garis bawah, atau tanda hubung (mulai dengan huruf/angka)"
  )

export const createMemberSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().max(80, "Maksimal 80 karakter").optional(),
})
export type CreateMemberValues = z.infer<typeof createMemberSchema>