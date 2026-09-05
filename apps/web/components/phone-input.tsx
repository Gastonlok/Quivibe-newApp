"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { normalizePhone, phoneCountries, splitPhone } from "@/lib/phone";

export function PhoneInput({
  value,
  onChange,
  name = "phone",
  label = "Téléphone",
  required = false,
  disabled = false,
}: {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value || "");
  const [phone, setPhone] = useState(() => splitPhone(value || ""));
  const [touched, setTouched] = useState(false);
  const normalized = normalizePhone(phone.national, phone.country);
  const invalid = Boolean(phone.national.trim()) && !normalized;
  const message = "Vérifiez le pays et le numéro de téléphone.";
  const submitted = phone.national.trim()
    ? normalized ||
      (phone.national.startsWith("+")
        ? phone.national
        : `+${getCountryCallingCode(phone.country)}${phone.national.replace(/\D/g, "")}`)
    : "";

  useEffect(() => {
    if (value !== undefined && value !== lastEmitted.current) {
      setPhone(splitPhone(value));
      lastEmitted.current = value;
      setTouched(false);
    }
  }, [value]);
  useEffect(() => {
    input.current?.setCustomValidity(invalid ? message : "");
  }, [invalid]);

  function update(next: typeof phone) {
    setPhone(next);
    const result = next.national.trim()
      ? normalizePhone(next.national, next.country) ||
        (next.national.startsWith("+")
          ? next.national
          : `+${getCountryCallingCode(next.country)}${next.national.replace(/\D/g, "")}`)
      : "";
    lastEmitted.current = result;
    onChange?.(result);
  }
  return (
    <fieldset className="min-w-0" disabled={disabled}>
      <legend className="mb-1.5 text-sm font-bold text-gray-800">
        {label}
        {required ? " *" : ""}
      </legend>
      <div className="grid grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] overflow-hidden rounded-2xl border border-gray-300 bg-white focus-within:border-primary-600 focus-within:ring-4 focus-within:ring-primary-100">
        <label htmlFor={`${id}-country`} className="sr-only">
          Pays et indicatif
        </label>
        <select
          id={`${id}-country`}
          value={phone.country}
          onChange={(event) =>
            update({ ...phone, country: event.target.value as CountryCode })
          }
          className="min-w-0 border-r border-gray-200 bg-gray-50 px-2 py-3 text-sm text-gray-800 outline-none"
        >
          {phoneCountries.map((item) => (
            <option key={item.country} value={item.country}>
              {item.label} (+{item.code})
            </option>
          ))}
        </select>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          ref={input}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          maxLength={40}
          value={phone.national}
          placeholder="Votre numéro"
          aria-invalid={(touched && invalid) || undefined}
          aria-describedby={`${id}-help${touched && invalid ? ` ${id}-error` : ""}`}
          onChange={(event) =>
            update(
              /^(\+|00)/.test(event.target.value.trim())
                ? splitPhone(event.target.value, phone.country)
                : { ...phone, national: event.target.value },
            )
          }
          onBlur={() => setTouched(true)}
          onInvalid={() => setTouched(true)}
          className="min-w-0 w-full bg-white px-3 py-3 text-base text-gray-900 outline-none sm:text-sm"
        />
      </div>
      <input type="hidden" name={name} value={submitted} />
      <p id={`${id}-help`} className="mt-1.5 text-xs text-gray-500">
        Choisissez le pays, puis saisissez votre numéro.
      </p>
      {touched && invalid && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1 text-xs text-red-700"
        >
          {message}
        </p>
      )}
    </fieldset>
  );
}
