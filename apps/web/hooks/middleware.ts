// apps/web/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// ============================================
// LISTE DES ROUTES PROTÉGÉES (URL RÉELLES)
// ============================================

// Routes accessibles uniquement aux admins
// ⚠️ Avec (admin)/dashboard → URL réelle = /dashboard
const ADMIN_ONLY_PATHS = [
  "/dashboard",      // Page admin !!!
  "/dashboard/places",
  "/dashboard/reviews",
  "/dashboard/users",
];

// Routes accessibles uniquement aux propriétaires
const OWNER_ONLY_PATHS = [
  "/places/new",
  "/places/:path*/edit",
  "/owner-dashboard", // Si vous avez un dossier (owner)/dashboard
];

// Routes accessibles uniquement aux utilisateurs connectés
const USER_ONLY_PATHS = [
  "/favorites",
  "/profile",
  "/reviews/new",
];

// ============================================
// MIDDLEWARE
// ============================================

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  console.log("🔐 Path:", pathname);
  console.log("🔐 Role:", req.auth?.user?.role);

  // Vérification admin
  const isAdminRoute = ADMIN_ONLY_PATHS.some((path) => {
    if (path.includes(":path*")) {
      const basePath = path.split("/:")[0];
      return pathname.startsWith(basePath);
    }
    return pathname === path || pathname.startsWith(path + "/");
  });

  // Vérification owner
  const isOwnerRoute = OWNER_ONLY_PATHS.some((path) => {
    if (path.includes(":path*")) {
      const basePath = path.split("/:")[0];
      return pathname.startsWith(basePath);
    }
    return pathname === path || pathname.startsWith(path + "/");
  });

  // Vérification utilisateur
  const isUserRoute = USER_ONLY_PATHS.some((path) => {
    if (path.includes(":path*")) {
      const basePath = path.split("/:")[0];
      return pathname.startsWith(basePath);
    }
    return pathname === path || pathname.startsWith(path + "/");
  });

  // 🔐 Admin
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
    const role = (req.auth?.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // 🔐 Owner
  if (isOwnerRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
    const role = (req.auth?.user as { role?: string } | undefined)?.role;
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  // 🔐 Utilisateur
  if (isUserRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/owner/:path*",
    "/favorites",      // ✅ Ajouter cette ligne
    "/favorites/:path*", // ✅ Pour les sous-routes
    "/profile",
  ],
};
