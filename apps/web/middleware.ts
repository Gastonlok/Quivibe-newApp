import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  console.log("🔐 ===== MIDDLEWARE ===== 🔐");
  console.log("🔐 Path:", path);
  console.log("🔐 Token:", token);
  console.log("🔐 Role:", token?.role);

  // ============================================
  // ROUTES ADMIN
  // ============================================
  if (path.startsWith("/admin")) {
    if (!token) {
      console.log("⛔ Non connecté → /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "ADMIN") {
      console.log("⛔ Pas admin → /");
      return NextResponse.redirect(new URL("/", request.url));
    }
    console.log("✅ Admin autorisé");
    return NextResponse.next();
  }

  // ============================================
  // ROUTES OWNER
  // ============================================
  if (path.startsWith("/owner")) {
    if (!token) {
      console.log("⛔ Non connecté → /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "OWNER" && token.role !== "ADMIN") {
      console.log("⛔ Pas owner → /");
      return NextResponse.redirect(new URL("/", request.url));
    }
    console.log("✅ Owner autorisé");
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/owner/:path*",
    "/favorites",
    "/profile",
  ],
};
