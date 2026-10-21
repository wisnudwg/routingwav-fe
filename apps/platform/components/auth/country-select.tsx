"use client"

import { Combobox, type ComboboxOption } from "@workspace/ui/components/combobox"
import { countries } from "@/lib/countries"
import { Flag } from "./flag"

const options: ComboboxOption[] = countries.map((c) => {
  const row = (
    <>
      <Flag code={c.code} />
      <span className="truncate">{c.name}</span>
    </>
  )
  return { value: c.code, label: c.name, searchText: c.code, render: row, display: row }
})

export function CountrySelect(props: {
  value: string
  onChange: (value: string) => void
  id?: string
  invalid?: boolean
}) {
  return (
    <Combobox
      options={options}
      placeholder="Select a country"
      searchPlaceholder="Search…"
      emptyText="Country not found"
      {...props}
    />
  )
}