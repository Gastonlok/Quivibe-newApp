import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Note : (dashboard) et (admin) sont des route groups Next.js — leur nom
// entre parenthèses n'apparaît PAS dans l'URL. On protège donc ici les
// vrais chemins d'URL exposés par ces groupes, pas "/dashboard" ou "/admin"
// littéralement. À tenir à jour à chaque nouvelle route ajoutée sous ces
// groupes (ou migrer vers un vrai segment "/admin" si le back-office grandit).
const OWNER_ONLY_PATHS = ["/places/new"];
const ADMIN_ONLY_PATHS: string[] = [];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  const isOwnerRoute = OWNER_ONLY_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  const isAdminRoute = ADMIN_ONLY_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (!isLoggedIn && (isOwnerRoute || isAdminRoute)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  if (isOwnerRoute && role !== "OWNER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/places/new", "/places/:path*/edit", "/admin/:path*"],
};
