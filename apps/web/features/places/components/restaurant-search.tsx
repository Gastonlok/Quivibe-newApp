"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CalendarCheck2,
  ChevronDown,
  Clock3,
  LocateFixed,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  Utensils,
  Wallet,
  X,
  Loader2,
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { AMENITY_LABELS, AMENITY_VALUES } from "../amenities";
import {
  emptyRestaurantSearch,
  restaurantSearchSchema,
  searchHref,
  type RestaurantSearch,
} from "../search-params";
import {
  restaurantSearchOptions,
  restaurantSuggestions,
} from "../search-actions";
import { SearchDialog } from "./search-dialog";
import { SearchAvailability } from "./search-availability";
import { SearchField, type SearchSuggestion } from "./search-field";

type Options = Awaited<ReturnType<typeof restaurantSearchOptions>>;
const defaultOptions: Options = {
  neighborhoods: [],
  categories: [
    { name: "Restaurant", slug: "restaurant" },
    { name: "Bar", slug: "bar" },
    { name: "Lounge", slug: "lounge" },
    { name: "Rooftop", slug: "rooftop" },
    { name: "Café", slug: "cafe" },
  ],
};
const priceLabels = ["Petit budget", "Modéré", "Élevé", "Gastronomique"];
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
const toggle = <T,>(values: T[], value: T) =>
  values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];

export function RestaurantSearch() {
  const router = useRouter(),
    params = useSearchParams(),
    query = params.toString();
  const current = useMemo(() => {
    const parsed = restaurantSearchSchema.safeParse(
      Object.fromEntries(new URLSearchParams(query)),
    );
    return parsed.success ? parsed.data : emptyRestaurantSearch();
  }, [query]);
  const [draft, setDraft] = useState(current);
  const [options, setOptions] = useState(defaultOptions);
  const [suggestions, setSuggestions] = useState<
    Awaited<ReturnType<typeof restaurantSuggestions>>
  >([]);
  const [dialog, setDialog] = useState<"availability" | "filters" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [locating, setLocating] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  const debounced = useDebounce(draft.search, 250);
  useEffect(() => {
    setDraft(current);
    setError("");
    setLocating(false);
    generation.current++;
  }, [current]);
  useEffect(() => {
    let active = true;
    restaurantSearchOptions()
      .then((data) => {
        if (active) setOptions(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setSuggestions([]);
    if (debounced.trim().length >= 2)
      restaurantSuggestions(debounced)
        .then((data) => {
          if (active) setSuggestions(data);
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [debounced]);

  function apply(next: RestaurantSearch) {
    generation.current++;
    setLocating(false);
    setError("");
    setDialog(null);
    const value = { ...next, page: 1 };
    setDraft(value);
    startTransition(() => router.push(searchHref(value), { scroll: false }));
  }
  function locate() {
    if (locating) return;
    if (draft.lat !== undefined) {
      apply({
        ...draft,
        lat: undefined,
        lng: undefined,
        sort: draft.sort === "distance" ? "relevance" : draft.sort,
      });
      return;
    }
    if (!navigator.geolocation) {
      setError(
        "La localisation n’est pas disponible. Saisissez un quartier ou une adresse.",
      );
      return;
    }
    const request = ++generation.current;
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (request !== generation.current) return;
        apply({
          ...draft,
          neighborhood: "",
          location: "",
          lat: Number(position.coords.latitude.toFixed(4)),
          lng: Number(position.coords.longitude.toFixed(4)),
          sort: "distance",
        });
      },
      () => {
        if (request !== generation.current) return;
        setLocating(false);
        setError(
          "Position inaccessible. Autorisez la localisation dans votre navigateur ou choisissez un quartier.",
        );
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false },
    );
  }
  const location = draft.neighborhood || draft.location;
  const locationItems: SearchSuggestion[] = [
    {
      label: "Autour de moi",
      value: "nearby",
      kind: "nearby",
      detail: "Utiliser ma position",
    },
    {
      label: "Tout Kinshasa",
      value: "",
      kind: "neighborhood",
      detail: "Tous les quartiers",
    },
    ...options.neighborhoods
      .filter((n) => !location || normalize(n).includes(normalize(location)))
      .slice(0, 8)
      .map((n) => ({
        value: n,
        label: n,
        detail: "Quartier · Kinshasa",
        kind: "neighborhood" as const,
      })),
  ];
  const queryItems: SearchSuggestion[] = [
    ...options.categories
      .filter(
        (c) =>
          !draft.search || normalize(c.name).includes(normalize(draft.search)),
      )
      .slice(0, 4)
      .map((c) => ({
        value: c.slug,
        label: c.name,
        detail: "Type d’établissement",
        kind: "category" as const,
      })),
    ...suggestions.map((p) => ({
      value: p.name,
      label: p.name,
      detail: p.neighborhood,
      kind: "restaurant" as const,
    })),
  ];
  const dateLabel = draft.date
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      }).format(new Date(`${draft.date}T12:00Z`))
    : "Date";
  const advancedCount =
    Number(Boolean(draft.category)) +
    Number(draft.priceRange.length > 0) +
    Number(Boolean(draft.minRating)) +
    Number(draft.reservationsOnly) +
    Number(draft.eventsOnly) +
    draft.amenities.length;
  const selections: { label: string; clear: Partial<RestaurantSearch> }[] = [
    ...(current.search
      ? [{ label: current.search, clear: { search: "" } }]
      : []),
    ...(current.location || current.neighborhood
      ? [
          {
            label: current.location || current.neighborhood,
            clear: { location: "", neighborhood: "" },
          },
        ]
      : []),
    ...(current.category
      ? [
          {
            label:
              options.categories.find((c) => c.slug === current.category)
                ?.name || current.category,
            clear: { category: "" },
          },
        ]
      : []),
    ...(current.priceRange.length
      ? [
          {
            label: `Budget ${current.priceRange.map((n) => "$".repeat(n)).join(" / ")}`,
            clear: { priceRange: [] },
          },
        ]
      : []),
    ...(current.minRating
      ? [{ label: `${current.minRating}/5 et plus`, clear: { minRating: 0 } }]
      : []),
    ...(current.date
      ? [
          {
            label: `${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${current.date}T12:00Z`))} · ${current.time} · ${current.partySize} pers.`,
            clear: { date: "", time: "", partySize: 2 },
          },
        ]
      : []),
    ...(current.lat !== undefined
      ? [
          {
            label: `À moins de ${current.radius} km`,
            clear: {
              lat: undefined,
              lng: undefined,
              sort:
                current.sort === "distance"
                  ? ("relevance" as const)
                  : current.sort,
            },
          },
        ]
      : []),
    ...(current.reservationsOnly
      ? [{ label: "Réservation en ligne", clear: { reservationsOnly: false } }]
      : []),
    ...(current.eventsOnly
      ? [{ label: "Événements à venir", clear: { eventsOnly: false } }]
      : []),
    ...current.amenities.map((a) => ({
      label: AMENITY_LABELS[a as (typeof AMENITY_VALUES)[number]],
      clear: { amenities: current.amenities.filter((v) => v !== a) },
    })),
  ];
  return (
    <section
      data-testid="restaurant-search"
      aria-label="Recherche et filtres"
      className="relative"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          apply(draft);
        }}
        role="search"
        aria-label="Rechercher un établissement"
        className="relative rounded-3xl border border-gray-200 bg-white p-2 shadow-medium sm:flex sm:items-center sm:rounded-full sm:p-2"
      >
        <SearchField
          label="Où ?"
          name="location"
          value={location}
          placeholder={
            draft.lat !== undefined
              ? "Autour de moi"
              : "Kinshasa, quartier ou adresse"
          }
          items={locationItems}
          onChange={(value) => {
            generation.current++;
            setLocating(false);
            setDraft({
              ...draft,
              location: value,
              neighborhood: "",
              lat: undefined,
              lng: undefined,
              sort: draft.sort === "distance" ? "relevance" : draft.sort,
            });
          }}
          onSelect={(item) => {
            if (item.kind === "nearby") locate();
            else {
              generation.current++;
              setLocating(false);
              setDraft({
                ...draft,
                neighborhood: item.value,
                location: "",
                lat: undefined,
                lng: undefined,
                sort: draft.sort === "distance" ? "relevance" : draft.sort,
              });
            }
          }}
        />
        <div className="mx-4 border-t border-gray-100 sm:mx-0 sm:h-9 sm:border-l sm:border-t-0" />
        <SearchField
          label="Quoi ?"
          name="search"
          value={draft.search}
          placeholder="Cuisine, nom de restaurant…"
          items={queryItems}
          onChange={(search) => setDraft({ ...draft, search })}
          onSelect={(item) =>
            setDraft({
              ...draft,
              ...(item.kind === "category"
                ? { category: item.value, search: "" }
                : { search: item.value }),
            })
          }
        />
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-7 py-3 text-sm font-extrabold text-white transition hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-60 sm:mt-0 sm:w-auto sm:shrink-0"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}{" "}
          Rechercher
        </button>
      </form>
      <div
        className="mt-4 flex gap-2 overflow-x-auto pb-2 pt-1"
        aria-label="Filtres rapides"
      >
        <FilterChip
          icon={CalendarDays}
          active={Boolean(draft.date)}
          onClick={() => setDialog("availability")}
        >
          {dateLabel}
          <ChevronDown className="h-3 w-3" />
        </FilterChip>
        <FilterChip
          icon={Clock3}
          active={Boolean(draft.date)}
          onClick={() => setDialog("availability")}
        >
          {draft.time || "Heure"}
          <ChevronDown className="h-3 w-3" />
        </FilterChip>
        <FilterChip
          icon={Users}
          active={Boolean(draft.date)}
          onClick={() => setDialog("availability")}
        >
          {draft.date ? `${draft.partySize} pers.` : "Personnes"}
          <ChevronDown className="h-3 w-3" />
        </FilterChip>
        <span className="mx-1 my-2 hidden border-l border-gray-200 sm:block" />
        <FilterChip
          icon={SlidersHorizontal}
          className="order-first sm:order-none"
          active={advancedCount > 0}
          onClick={() => setDialog("filters")}
        >
          Tous les filtres
          {advancedCount > 0 && (
            <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-[10px] text-white">
              {advancedCount}
            </span>
          )}
        </FilterChip>
        <FilterChip
          icon={Wallet}
          active={draft.priceRange.length > 0}
          onClick={() => setDialog("filters")}
        >
          Budget
          <ChevronDown className="h-3 w-3" />
        </FilterChip>
        <FilterChip
          icon={Star}
          active={draft.minRating >= 4}
          onClick={() =>
            apply({
              ...draft,
              minRating: draft.minRating >= 4 ? 0 : 4,
              sort: draft.minRating >= 4 ? "relevance" : "rating",
            })
          }
        >
          Les mieux notés
        </FilterChip>
        <FilterChip
          icon={locating ? Loader2 : LocateFixed}
          active={draft.lat !== undefined}
          onClick={locate}
          disabled={locating}
        >
          {locating ? "Localisation…" : "Autour de moi"}
        </FilterChip>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {error}
        </p>
      )}
      {selections.length > 0 && (
        <div
          className="mt-2 flex flex-wrap items-center gap-2"
          aria-label="Critères sélectionnés"
        >
          {selections.map((item, index) => (
            <button
              type="button"
              key={`${item.label}-${index}`}
              onClick={() => apply({ ...current, ...item.clear })}
              aria-label={`Retirer le filtre ${item.label}`}
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-800"
            >
              <span className="truncate">{item.label}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => apply(emptyRestaurantSearch())}
            className="px-2 py-1.5 text-xs font-bold text-gray-500 underline underline-offset-4 hover:text-gray-900"
          >
            Tout effacer
          </button>
        </div>
      )}
      {dialog === "availability" && (
        <SearchDialog
          title="Quand souhaitez-vous réserver ?"
          onClose={() => setDialog(null)}
        >
          <SearchAvailability
            filters={draft}
            onApply={(value) => apply({ ...draft, ...value })}
            onClear={() =>
              apply({ ...draft, date: "", time: "", partySize: 2 })
            }
          />
        </SearchDialog>
      )}
      {dialog === "filters" && (
        <SearchDialog
          title="Affiner votre recherche"
          onClose={() => setDialog(null)}
        >
          <AdvancedFilters value={draft} options={options} onApply={apply} />
        </SearchDialog>
      )}
    </section>
  );
}

function FilterChip({
  icon: Icon,
  active,
  children,
  onClick,
  disabled,
  className = "",
}: {
  icon: React.ElementType;
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={disabled}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-primary-600 disabled:opacity-50 ${active ? "border-primary-500 bg-primary-50 text-primary-800" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"} ${className}`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function AdvancedFilters({
  value,
  options,
  onApply,
}: {
  value: RestaurantSearch;
  options: Options;
  onApply: (value: RestaurantSearch) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
      }}
    >
      <div className="space-y-7 p-5 sm:p-7">
        <fieldset>
          <legend className="mb-3 flex items-center gap-2 font-extrabold">
            <Utensils className="h-4 w-4 text-primary-600" /> Type
            d’établissement
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.categories.map((c) => (
              <Choice
                key={c.slug}
                active={draft.category === c.slug}
                onClick={() =>
                  setDraft({
                    ...draft,
                    category: draft.category === c.slug ? "" : c.slug,
                  })
                }
              >
                {c.name}
              </Choice>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-extrabold">Votre budget</legend>
          <p className="mb-3 text-xs text-gray-500">
            Gammes de prix indiquées par les établissements.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {priceLabels.map((label, index) => (
              <button
                type="button"
                key={label}
                aria-pressed={draft.priceRange.includes(index + 1)}
                onClick={() =>
                  setDraft({
                    ...draft,
                    priceRange: toggle(draft.priceRange, index + 1).sort(),
                  })
                }
                className={`rounded-2xl border px-3 py-4 text-center ${draft.priceRange.includes(index + 1) ? "border-primary-600 bg-primary-50 text-primary-800" : "border-gray-200 text-gray-700"}`}
              >
                <span className="block text-lg font-extrabold">
                  {"$".repeat(index + 1)}
                </span>
                <span className="mt-1 block text-xs">{label}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 font-extrabold">Note des clients</legend>
          <div className="flex flex-wrap gap-2">
            {[0, 3, 4, 4.5].map((rating) => (
              <Choice
                key={rating}
                active={draft.minRating === rating}
                onClick={() => setDraft({ ...draft, minRating: rating })}
              >
                {rating ? `${rating}/5 et plus` : "Toutes les notes"}
              </Choice>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-3 font-extrabold">Sur place</legend>
          <div className="flex flex-wrap gap-2">
            {AMENITY_VALUES.map((amenity) => (
              <Choice
                key={amenity}
                active={draft.amenities.includes(amenity)}
                onClick={() =>
                  setDraft({
                    ...draft,
                    amenities: toggle(draft.amenities, amenity),
                  })
                }
              >
                {AMENITY_LABELS[amenity]}
              </Choice>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="mb-3 font-extrabold">Vos envies</legend>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.reservationsOnly}
              onChange={(event) =>
                setDraft({ ...draft, reservationsOnly: event.target.checked })
              }
              className="h-5 w-5 accent-primary-600"
            />
            <CalendarCheck2 className="h-4 w-4 text-primary-600" /> Réservation
            en ligne
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={draft.eventsOnly}
              onChange={(event) =>
                setDraft({ ...draft, eventsOnly: event.target.checked })
              }
              className="h-5 w-5 accent-primary-600"
            />
            <CalendarDays className="h-4 w-4 text-primary-600" /> Événements à
            venir
          </label>
        </fieldset>
        {draft.lat !== undefined && (
          <label className="block text-sm font-extrabold">
            Distance maximale
            <select
              value={draft.radius}
              onChange={(event) =>
                setDraft({ ...draft, radius: Number(event.target.value) })
              }
              className="ml-3 rounded-xl border border-gray-200 px-3 py-2"
            >
              {[2, 5, 10, 20].map((radius) => (
                <option key={radius} value={radius}>
                  {radius} km
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-gray-100 bg-white p-5 sm:px-7">
        <button
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              category: "",
              priceRange: [],
              minRating: 0,
              amenities: [],
              reservationsOnly: false,
              eventsOnly: false,
            })
          }
          className="text-sm font-bold text-gray-600 underline underline-offset-4"
        >
          Réinitialiser
        </button>
        <button
          type="submit"
          className="rounded-full bg-primary-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-primary-700"
        >
          Appliquer les filtres
        </button>
      </div>
    </form>
  );
}

function Choice({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2.5 text-sm font-semibold ${active ? "border-primary-600 bg-primary-50 text-primary-800" : "border-gray-200 text-gray-700 hover:border-gray-400"}`}
    >
      {children}
    </button>
  );
}
