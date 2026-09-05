import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    // Auth.js prefixes the session cookie with __Secure- in production.
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (path.startsWith("/admin")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
    // Fine-grained permissions are checked from the database in the server layout/API.
  }

  const publicOwnerRoutes = [
    "/owner/login",
    "/owner/register",
    "/owner/pricing",
  ];
  const isPrivateOwnerRoute =
    path.startsWith("/owner") &&
    !publicOwnerRoutes.some(
      (route) => path === route || path.startsWith(`${route}/`),
    );

  if (isPrivateOwnerRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
    // Owner pages and actions validate current ownership/role on the server.
  }

  if (
    ["/favorites", "/profile", "/reservations", "/messages"].some((route) =>
      path.startsWith(route),
    )
  ) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/owner/:path*",
    "/favorites/:path*",
    "/profile/:path*",
    "/reservations/:path*",
    "/messages/:path*",
  ],
};
