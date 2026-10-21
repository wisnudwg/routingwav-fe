"use client"

import { Combobox, type ComboboxOption } from "@workspace/ui/components/combobox"
import { Input } from "@workspace/ui/components/input"
import { countries } from "@/lib/countries"
import { Flag } from "./flag"

const dialOptions: ComboboxOption[] = countries.map((c) => ({
  value: c.code,
  label: `${c.name} +${c.dial}`,
  searchText: `${c.code} ${c.dial} +${c.dial}`,
  render: (
    <>
      <Flag code={c.code} />
      <span className="flex-1 truncate">{c.name}</span>
      <span className="text-muted-foreground">+{c.dial}</span>
    </>
  ),
  display: (
    <>
      <Flag code={c.code} />
      <span>+{c.dial}</span>
    </>
  ),
}))

export function PhoneInput({
  country,
  number,
  onCountryChange,
  onNumberChange,
  invalid,
}: {
  country: string
  number: string
  onCountryChange: (v: string) => void
  onNumberChange: (v: string) => void
  invalid?: boolean
}) {
  return (
    <div className="flex flex-nowrap gap-2">
      <div className="w-32 shrink-0">
        <Combobox
          options={dialOptions}
          value={country}
          onChange={onCountryChange}
          placeholder="Kode"
          searchPlaceholder="Find country or code…"
          emptyText="Not found"
          panelClassName="w-80"
          invalid={invalid}
        />
      </div>
      <Input
        id="phoneNumber"
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="81234567890"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/\D/g, ""))}
        aria-invalid={invalid}
        className="min-w-0 flex-1"
      />
    </div>
  )
}