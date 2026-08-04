"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home,
  MapPin,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Heart,
  Bell,
   Building2,  // ✅ Ajouter cette icône
  LayoutDashboard,  // ✅ Ajouter aussi celle-ci si nécessaire
  Sparkles,
  Utensils,
  Users,
  Shield,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isActive = (path: string) => pathname === path;
  const user = session?.user;
  const isAuthenticated = status === "authenticated";

const navLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/discover", label: "Découvrir", icon: Sparkles },
  { href: "/map", label: "Carte", icon: MapPin },
  { href: "/events", label: "Événements", icon: Calendar },
  { href: "/owners", label: "Espace pro", icon: Building2 }, // ✅ Nouveau libellé
];


  // Dashboard links selon le rôle
  const getDashboardLink = () => {
    if (user?.role === "ADMIN") return { href: "/admin/dashboard", label: "Admin", icon: Shield };
    if (user?.role === "OWNER") return { href: "/owner/dashboard", label: "Dashboard", icon: Store };
    return null;
  };

  const dashboardLink = getDashboardLink();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary-200/50 transition-shadow">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                Quivibe
              </span>
              <span className="hidden md:inline-block text-[10px] font-medium text-primary-500 ml-1 px-1.5 py-0.5 bg-primary-50 rounded-full">
                .cd
              </span>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    active
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {active && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary-500 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Dashboard link pour admin/owner */}
            {dashboardLink && (
              <Link
                href={dashboardLink.href}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-50 text-primary-600 rounded-full hover:bg-primary-100 transition-colors"
              >
                <dashboardLink.icon className="w-4 h-4" />
                {dashboardLink.label}
              </Link>
            )}

            {/* Notifications */}
            {isAuthenticated && (
              <button className="relative p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-50">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            )}

            {/* Favoris */}
            {isAuthenticated && (
              <Link
                href="/favorites"
                className="p-2 text-gray-500 hover:text-primary-600 transition-colors rounded-full hover:bg-gray-50"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {/* Profil / Connexion */}
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full">
                  <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-xs">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name?.split(" ")[0] || "Utilisateur"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-full hover:shadow-lg hover:shadow-primary-200/50 transition-all duration-300 hover:scale-105"
                >
                  Se connecter
                </Link>
                <Link
                  href="/register"
                  className="hidden md:inline-flex px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  S'inscrire
                </Link>
              </>
            )}

            {/* Menu Mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-primary-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Barre de recherche mobile */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-3"
            >
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher..."
                  className="w-full px-4 py-2.5 pl-10 rounded-full border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 py-3"
            >
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        active
                          ? "text-primary-600 bg-primary-50"
                          : "text-gray-600 hover:text-primary-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{link.label}</span>
                      {active && (
                        <div className="ml-auto w-1.5 h-8 bg-primary-500 rounded-full" />
                      )}
                    </Link>
                  );
                })}

                {/* Dashboard link dans menu mobile */}
                {dashboardLink && (
                  <Link
                    href={dashboardLink.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary-600 bg-primary-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <dashboardLink.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{dashboardLink.label}</span>
                  </Link>
                )}

                {/* Favoris dans menu mobile */}
                {isAuthenticated && (
                  <Link
                    href="/favorites"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium">Mes favoris</span>
                  </Link>
                )}

                <div className="border-t border-gray-100 my-3 pt-3">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Déconnexion</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <User className="w-5 h-5" />
                        <span className="text-sm font-medium">Se connecter</span>
                      </Link>
                      <Link
                        href="/register"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-medium">S'inscrire</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
