import { z } from "zod"

export const TALENT_ROLE_OPTIONS = [
  "Music Producer",
  "Music Arranger",
  "Songwriter / Composer",
  "Mixing Engineer",
  "Mastering Engineer",
  "Studio Owner / Recording Space",
  "Session Player",
  "Other",
] as const

export const CLIENT_ROLE_OPTIONS = [
  "Musisi / Solois",
  "Grup / Band",
  "Bisnis / Agency / Brand",
  "Other",
] as const

export const signInSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
})
export type SignInValues = z.infer<typeof signInSchema>

export const PASSWORD_SPECIFICATIONS = [
  "Password must be at least 8 characters long",
  "Password must contain at least 1 uppercase letter",
  "Password must contain at least 1 lowercase letter",
  "Password must contain at least 1 numeric letter",
  "Password must contain at least 1 special letter",
]

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least 1 uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least 1 lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least 1 numeric letter" })
  .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least 1 special letter" })

export const registerTalentSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    email: z.string().trim().email("Email tidak valid"),
    password: passwordSchema,
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
    phoneCountry: z.string().min(1, "Pilih kode negara"),
    phoneNumber: z.string().regex(/^\d{6,15}$/, "Nomor telepon harus 6–15 digit"),
    country: z.string().min(1, "Pilih negara"),
    address: z.string().trim().min(5, "Alamat terlalu pendek"),
    roles: z.array(z.string()).min(1, "Pilih minimal satu peran"),
    otherRole: z.string().trim().optional(),
    instruments: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirm_password) {
      ctx.addIssue({ code: "custom", path: ["confirm_password"], message: "Password tidak sama" })
    }
    if (v.roles.includes("Other") && !v.otherRole) {
      ctx.addIssue({ code: "custom", path: ["otherRole"], message: "Tuliskan peran Anda" })
    }
    if (v.roles.includes("Session Player") && !v.instruments) {
      ctx.addIssue({ code: "custom", path: ["instruments"], message: "Tuliskan instrumen Anda" })
    }
  })
export type RegisterTalentValues = z.infer<typeof registerTalentSchema>

export const registerClientSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter"),
    email: z.string().trim().email("Email tidak valid"),
    password: passwordSchema,
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
    phoneCountry: z.string().min(1, "Pilih kode negara"),
    phoneNumber: z.string().regex(/^\d{6,15}$/, "Nomor telepon harus 6–15 digit"),
    country: z.string().min(1, "Pilih negara"),
    address: z.string().trim().min(5, "Alamat terlalu pendek"),
    roles: z.array(z.string()).min(1, "Pilih minimal satu peran"),
    otherRole: z.string().trim().optional(),
    instruments: z.string().trim().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirm_password) {
      ctx.addIssue({ code: "custom", path: ["confirm_password"], message: "Password tidak sama" })
    }
    if (v.roles.includes("Other") && !v.otherRole) {
      ctx.addIssue({ code: "custom", path: ["otherRole"], message: "Tuliskan peran Anda" })
    }
    if (v.roles.includes("Session Player") && !v.instruments) {
      ctx.addIssue({ code: "custom", path: ["instruments"], message: "Tuliskan instrumen Anda" })
    }
  })
export type RegisterClientValues = z.infer<typeof registerTalentSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email tidak valid"),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirm_password: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((v) => v.password === v.confirm_password, {
    path: ["confirm_password"],
    message: "Password tidak sama",
  })
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>