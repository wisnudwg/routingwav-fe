"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { dialCodeOf } from "@/lib/countries"
import { CLIENT_ROLE_OPTIONS, registerClientSchema, type RegisterClientValues } from "@/lib/validators"
import { CountrySelect } from "./country-select"
import { FormField } from "./form-field"
import { GoogleButton, OrDivider } from "./google-button"
import { PasswordInput, PasswordSpecifications } from "./password-input"
import { PhoneInput } from "./phone-input"

export function RegisterClientForm() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterClientValues>({
    resolver: zodResolver(registerClientSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm_password: "",
      phoneCountry: "ID",
      phoneNumber: "",
      country: "",
      address: "",
      roles: [],
      otherRole: "",
      instruments: "",
    },
  })

  const roles = watch("roles")
  const set = <K extends keyof RegisterClientValues>(name: K, value: RegisterClientValues[K]) =>
    setValue(name, value as any, { shouldValidate: isSubmitted, shouldDirty: true })

  function toggleRole(role: string) {
    set("roles", roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role])
  }

  async function onSubmit(v: RegisterClientValues) {
    const payload = {
      name: v.name.trim(),
      email: v.email.trim().toLowerCase(),
      phone: `+${dialCodeOf(v.phoneCountry)}${v.phoneNumber}`,
      country: v.country, // ISO 3166-1 alpha-2
      address: v.address.trim(),
      roles: v.roles,
      otherRole: v.roles.includes("Other") ? v.otherRole?.trim() : undefined,
      instruments: v.roles.includes("Session Player") ? v.instruments?.trim() : undefined,
    }
    // TODO: POST { ...payload, password: v.password } to the API
    console.log("register payload", payload)
    router.push("/auth/sign-in")
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center">
          <h1 className="font-heading text-3xl font-bold text-slate-900">Register as Client</h1>
          <p className="text-md text-slate-600">
            ({" "}or{" "}
            <Link href="/auth/register/talent" className="font-medium text-brand hover:underline">
              register as Talent
            </Link>{" "})
          </p>
        </div>
        {/* <p className="mt-1 text-sm text-slate-600">Bergabung dengan komunitas produksi musik Indonesia.</p> */}
        <p className="mt-1 text-sm text-slate-600">Gain access to Indonesia&apos;s music production community.</p>
      </div>

      <GoogleButton label="Register with Google" />
      <OrDivider text="or register via the following form" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormField label="Name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="password" error={errors.password?.message}>
            <PasswordInput id="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          </FormField>
          <FormField label="Confirm Password" htmlFor="confirm_password" error={errors.confirm_password?.message}>
            <PasswordInput id="confirm_password" autoComplete="new-password" aria-invalid={!!errors.confirm_password} {...register("confirm_password")} />
          </FormField>
        </div>
        <PasswordSpecifications />

        <FormField
          label="Phone Number"
          htmlFor="phoneNumber"
          error={errors.phoneNumber?.message ?? errors.phoneCountry?.message}
        >
          <PhoneInput
            country={watch("phoneCountry")}
            number={watch("phoneNumber")}
            onCountryChange={(v) => set("phoneCountry", v)}
            onNumberChange={(v) => set("phoneNumber", v)}
            invalid={!!errors.phoneNumber || !!errors.phoneCountry}
          />
        </FormField>

        <FormField label="Country" htmlFor="country" error={errors.country?.message}>
          <CountrySelect
            id="country"
            value={watch("country")}
            onChange={(v) => set("country", v)}
            invalid={!!errors.country}
          />
        </FormField>

        <FormField label="Address" htmlFor="address" error={errors.address?.message}>
          <Input id="address" autoComplete="street-address" aria-invalid={!!errors.address} {...register("address")} />
        </FormField>

        <fieldset className="space-y-3">
          <div className="space-y-0">
            <legend className="text-sm font-medium text-slate-800">Role</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CLIENT_ROLE_OPTIONS.map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-checked:border-brand has-checked:bg-brand/5"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="size-4 accent-brand"
                  />
                  {role}
                </label>
              ))}
            </div>
            {errors.roles?.message && (
              <p role="alert" className="text-xs text-destructive">{errors.roles.message}</p>
            )}
          </div>

          {roles.includes("Session Player") && (
            <FormField label="Instruments" htmlFor="instruments" error={errors.instruments?.message}>
              <Input id="instruments" placeholder="e.g. Guitar, Bass, Drum" aria-invalid={!!errors.instruments} {...register("instruments")} />
            </FormField>
          )}

          {roles.includes("Other") && (
            <FormField label="Other Role" htmlFor="otherRole" error={errors.otherRole?.message}>
              <Input id="otherRole" placeholder="Specify your role" aria-invalid={!!errors.otherRole} {...register("otherRole")} />
            </FormField>
          )}
        </fieldset>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Register as Client
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-medium text-brand hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  )
}