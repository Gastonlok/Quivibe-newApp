import {
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { z } from "zod";
import countryData from "./phone-countries.json";

export const DEFAULT_PHONE_COUNTRY: CountryCode = "CD";
// Fixed French labels and ordering keep server and browser markup identical.
export const phoneCountries = countryData.map((item) => ({
  ...item,
  country: item.country as CountryCode,
}));

export function normalizePhone(
  value: string,
  country: CountryCode = DEFAULT_PHONE_COUNTRY,
): string | null {
  const input = value.trim().replace(/^00/, "+");
  if (!input || !/^[+\d\s().-]+$/.test(input)) return null;
  const phone = parsePhoneNumberFromString(input, {
    defaultCountry: country,
    extract: false,
  });
  return phone?.isPossible() && !phone.ext ? phone.number : null;
}

export function splitPhone(
  value: string,
  fallback: CountryCode = DEFAULT_PHONE_COUNTRY,
) {
  const input = value.trim().replace(/^00/, "+");
  if (!input.startsWith("+")) return { country: fallback, national: input };
  const phone = parsePhoneNumberFromString(input, { extract: false });
  const digits = input.replace(/\D/g, "");
  const matches = phoneCountries
    .filter((item) => digits.startsWith(item.code))
    .sort((a, b) => b.code.length - a.code.length);
  const country =
    phone?.country ||
    matches.find((item) => item.country === fallback)?.country ||
    matches[0]?.country;
  if (!country) return { country: fallback, national: input };
  return {
    country,
    national: digits.slice(getCountryCallingCode(country).length),
  };
}

export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(40)
  .refine(
    (value) => !value || normalizePhone(value) !== null,
    "Vérifiez le pays et le numéro de téléphone.",
  )
  .transform((value) => (value ? normalizePhone(value)! : ""))
  .optional();
