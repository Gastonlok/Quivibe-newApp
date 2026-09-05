"use client";

import { useId, useState } from "react";
import { X, MapPin, Search } from "lucide-react";

export type SearchSuggestion = {
  value: string;
  label: string;
  detail?: string;
  kind?: "nearby" | "neighborhood" | "category" | "restaurant";
};
export function SearchField({
  label,
  name,
  value,
  placeholder,
  items,
  onChange,
  onSelect,
}: {
  label: string;
  name: "search" | "location";
  value: string;
  placeholder: string;
  items: SearchSuggestion[];
  onChange: (value: string) => void;
  onSelect: (item: SearchSuggestion) => void;
}) {
  const id = useId(),
    [open, setOpen] = useState(false),
    [active, setActive] = useState(-1);
  const Icon = name === "location" ? MapPin : Search;
  function select(item: SearchSuggestion) {
    onSelect(item);
    setOpen(false);
    setActive(-1);
  }
  return (
    <div
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false);
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 focus-within:bg-primary-50/60 sm:px-5">
        <Icon className="h-5 w-5 shrink-0 text-primary-600" />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={id}
            className="mb-0.5 block text-xs font-extrabold text-gray-900"
          >
            {label}
          </label>
          <input
            id={id}
            name={name}
            value={value}
            maxLength={name === "location" ? 120 : 100}
            onChange={(event) => {
              onChange(event.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                return;
              }
              if (event.key === "ArrowDown" && items.length) {
                event.preventDefault();
                setOpen(true);
                setActive((n) => (n + 1) % items.length);
              }
              if (event.key === "ArrowUp" && items.length) {
                event.preventDefault();
                setOpen(true);
                setActive((n) => (n <= 0 ? items.length - 1 : n - 1));
              }
              if (
                event.key === "Enter" &&
                open &&
                active >= 0 &&
                items[active]
              ) {
                event.preventDefault();
                select(items[active]);
              }
            }}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && items.length > 0}
            aria-controls={`${id}-options`}
            aria-activedescendant={
              open && active >= 0 && items[active]
                ? `${id}-${active}`
                : undefined
            }
            autoComplete="off"
            placeholder={placeholder}
            className="w-full bg-transparent py-1 text-base text-gray-800 outline-none placeholder:text-gray-400 sm:text-sm"
          />
        </div>
        {value && (
          <button
            type="button"
            aria-label={`Effacer ${label.replace(" ?", "").toLowerCase()}`}
            onClick={() => {
              onChange("");
              setActive(-1);
            }}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && items.length > 0 && (
        <ul
          id={`${id}-options`}
          role="listbox"
          aria-label={`Suggestions ${label}`}
          className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"
        >
          {items.map((item, index) => (
            <li key={`${item.kind}-${item.value}-${index}`}>
              <button
                id={`${id}-${index}`}
                type="button"
                role="option"
                aria-selected={active === index}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(item)}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left ${active === index ? "bg-primary-50" : "hover:bg-gray-50"}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <span>
                  <span className="block text-sm font-bold text-gray-800">
                    {item.label}
                  </span>
                  {item.detail && (
                    <span className="mt-0.5 block text-xs text-gray-500">
                      {item.detail}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
