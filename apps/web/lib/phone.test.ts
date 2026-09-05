import { expect, it } from "vitest";
import { getCountries, getCountryCallingCode } from "libphonenumber-js";
import {
  normalizePhone,
  optionalPhoneSchema,
  phoneCountries,
  splitPhone,
} from "./phone";

it.each([
  ["0812345678", "CD", "+243812345678"],
  ["812345678", "CD", "+243812345678"],
  ["06 12 34 56 78", "FR", "+33612345678"],
  ["+33 6 12 34 56 78", "CD", "+33612345678"],
  ["0032 470 12 34 56", "CD", "+32470123456"],
  ["02 1234 5678", "IT", "+390212345678"],
] as const)("normalizes %s for %s", (value, country, result) =>
  expect(normalizePhone(value, country)).toBe(result),
);
it.each(["+243", "123", "abc812345678", "+999812345678", "+33612345678 ext 5"])(
  "rejects incomplete or malformed %s",
  (value) => expect(optionalPhoneSchema.safeParse(value).success).toBe(false),
);
it("keeps the national number when pasting an international number and distinguishes shared codes", () => {
  expect(splitPhone("0033 6 12 34 56 78")).toEqual({
    country: "FR",
    national: "612345678",
  });
  expect(splitPhone("+1 416 555 0123")).toEqual({
    country: "CA",
    national: "4165550123",
  });
  expect(phoneCountries[0]).toMatchObject({ country: "CD", code: "243" });
  expect(phoneCountries.length).toBeGreaterThan(200);
  expect(phoneCountries.map((item) => item.country).sort()).toEqual(
    getCountries().sort(),
  );
  for (const item of phoneCountries)
    expect(item.code).toBe(getCountryCallingCode(item.country));
  expect(optionalPhoneSchema.parse("")).toBe("");
});
