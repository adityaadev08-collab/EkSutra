// =============================================================================
// middleware.ts — Unified Route Guard for EkSutra
// =============================================================================
// WHY AT THE ROOT: Next.js middleware MUST live at the project root.
// PURPOSE:
//   Intercepts legacy routes (/dashboard, /login) and smoothly redirects
//   them to the unified home route (/), eliminating the split UI.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If a citizen requests the legacy /dashboard or /login paths,
  // redirect them to the unified dashboard homepage.
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/login") {
    // Redirect /login to homepage with query param to auto-open modal if desired
    return NextResponse.redirect(new URL("/?login=true", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
