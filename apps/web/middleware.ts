import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protection des routes (dashboard) et (admin).
// La vérification de session/role réelle sera branchée sur Auth.js
// une fois la feature `auth` implémentée (voir features/auth).
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
