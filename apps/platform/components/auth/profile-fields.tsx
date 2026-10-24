"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@workspace/ui/components/input"
import { ROLE_OPTIONS, type ProfileValues } from "@/lib/validators"
import { CountrySelect } from "./country-select"
import { FormField } from "./form-field"
import { PhoneInput } from "./phone-input"

export function ProfileFields() {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isSubmitted },
  } = useFormContext<ProfileValues>()

  const roles = watch("roles")
  const set = <K extends keyof ProfileValues>(name: K, value: ProfileValues[K]) =>
    setValue(name, value as any, { shouldValidate: isSubmitted, shouldDirty: true })

  function toggleRole(role: string) {
    set("roles", roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role])
  }

  return (
    <>
      <FormField
        label="Nomor telepon"
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

      <FormField label="Negara" htmlFor="country" error={errors.country?.message}>
        <CountrySelect
          id="country"
          value={watch("country")}
          onChange={(v) => set("country", v)}
          invalid={!!errors.country}
        />
      </FormField>

      <FormField label="Alamat" htmlFor="address" error={errors.address?.message}>
        <Input id="address" autoComplete="street-address" aria-invalid={!!errors.address} {...register("address")} />
      </FormField>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-800">Peran Anda</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((role) => (
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

        {roles.includes("Session Player") && (
          <FormField label="Instrumen yang Anda mainkan" htmlFor="instruments" error={errors.instruments?.message}>
            <Input id="instruments" placeholder="mis. Gitar, Bass, Drum" aria-invalid={!!errors.instruments} {...register("instruments")} />
          </FormField>
        )}

        {roles.includes("Other") && (
          <FormField label="Peran lainnya" htmlFor="otherRole" error={errors.otherRole?.message}>
            <Input id="otherRole" placeholder="Tuliskan peran Anda" aria-invalid={!!errors.otherRole} {...register("otherRole")} />
          </FormField>
        )}
      </fieldset>
    </>
  )
}