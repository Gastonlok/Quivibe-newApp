"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarCheck2,
  Heart,
  LogOut,
  MapPin,
  Menu,
  Mail,
  Search,
  Sparkles,
  Shield,
  Store,
  UserRound,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

const publicLinks = [
  { href: "/discover", label: "Restaurants", icon: Search },
  { href: "/map", label: "Quivibe AI", icon: Sparkles },
  { href: "/events", label: "Événements", icon: CalendarCheck2 },
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const header = useRef<HTMLElement>(null);
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const authenticated =
    status === "authenticated" && Boolean(session?.user?.id);
  const role = session?.user?.role;

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    const updateHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${element.getBoundingClientRect().height}px`,
      );
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--site-header-height");
    };
  }, []);

  const accountLinks = authenticated
    ? [
        {
          href: "/reservations",
          label: "Mes réservations",
          icon: CalendarCheck2,
        },
        { href: "/favorites", label: "Favoris", icon: Heart },
        { href: "/messages", label: "Messages", icon: Mail },
      ]
    : [];

  const dashboard =
    role === "ADMIN" || Boolean(session?.user?.moderationPermissions?.length)
      ? { href: "/admin/dashboard", label: "Administration", icon: Shield }
      : role === "OWNER"
        ? { href: "/owner/dashboard", label: "Espace pro", icon: Store }
        : null;

  const links = [...publicLinks, ...accountLinks].filter(
    ({ href }) =>
      role !== "ADMIN" ||
      !["/favorites", "/events", "/reservations", "/map"].includes(href),
  );

  return (
    <>
      {isHome && (
        <aside
          aria-label="Partenaires Quivibe"
          className="border-b border-primary-100 bg-primary-50"
        >
          <div className="container flex min-h-12 items-center justify-center gap-4 py-1.5 sm:justify-between">
            <p className="hidden text-xs font-semibold text-primary-900 sm:block">
              Vous gérez un restaurant, un bar ou un lounge ?
            </p>
            <Link
              href="/owners"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3 text-xs font-extrabold text-primary-800 transition hover:bg-primary-100 hover:text-primary-950 sm:text-sm"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              Devenez partenaire
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      )}
      <header
        ref={header}
        className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur"
      >
        <div className="container flex flex-wrap items-center justify-between gap-2 py-3">
          <Link
            href="/"
            className={`relative shrink-0 overflow-hidden rounded-lg ${isHome ? "h-10 w-24 min-[375px]:w-32 sm:h-12 sm:w-40" : "h-12 w-40"}`}
            onClick={() => setOpen(false)}
          >
            <Image
              src="/brand/quivibe-logo.png"
              alt="Quivibe - Ne cherche plus, vibe ou tu veux"
              fill
              priority
              sizes="160px"
              className="object-cover object-center"
            />
          </Link>

          <nav
            className={`hidden min-w-0 flex-wrap items-center justify-center gap-1 lg:flex ${isHome && authenticated ? "order-last basis-full" : "flex-1"}`}
            aria-label="Navigation principale"
          >
            {links.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {dashboard && (
              <Link
                href={dashboard.href}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-extrabold text-gray-800 hover:border-primary-600 hover:text-primary-700"
              >
                {dashboard.label}
              </Link>
            )}

            {authenticated ? (
              <>
                <span className="max-w-36 truncate px-2 text-sm font-bold text-gray-700">
                  {session?.user?.name || "Mon compte"}
                </span>
                <Link
                  href="/profile"
                  className="rounded-full p-2 text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                  aria-label="Modifier mon profil"
                >
                  <UserRound className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-700"
                  aria-label="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full px-4 py-2 text-sm font-extrabold text-gray-800 hover:bg-gray-100"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-primary-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-primary-700"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="shrink-0 rounded-full p-2 text-gray-700 lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-gray-200 bg-white px-4 py-4 lg:hidden">
            <div className="mx-auto max-w-7xl space-y-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-gray-800 hover:bg-gray-100"
                >
                  <Icon className="h-5 w-5 text-primary-700" />
                  {label}
                </Link>
              ))}
              {dashboard && (
                <Link
                  href={dashboard.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-extrabold text-gray-800 hover:bg-gray-100"
                >
                  <dashboard.icon className="h-5 w-5 text-primary-700" />
                  {dashboard.label}
                </Link>
              )}
              {!authenticated ? (
                <div className="grid grid-cols-2 gap-2 pt-3">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-gray-300 px-4 py-3 text-center text-sm font-extrabold text-gray-800"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary-600 px-4 py-3 text-center text-sm font-extrabold text-white"
                  >
                    Inscription
                  </Link>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center rounded-full border border-primary-200 p-3 text-primary-700"
                    aria-label="Modifier mon profil"
                  >
                    <UserRound className="h-5 w-5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-3 text-sm font-extrabold text-red-700"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
