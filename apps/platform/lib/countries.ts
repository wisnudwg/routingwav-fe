import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js"

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

export type Country = { code: CountryCode; name: string; dial: string }

export const countries: Country[] = getCountries()
  .map((code) => ({
    code,
    name: regionNames.of(code) ?? code,
    dial: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

export const dialCodeOf = (code: string) =>
  countries.find((c) => c.code === code)?.dial ?? ""