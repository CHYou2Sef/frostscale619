import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * FROSTSCALE619 — Request proxy
 *
 * Handles Supabase session refresh and tenant route protection.
 * Unauthenticated users are redirected to /auth/login.
 * Authenticated users without an organization are redirected to /onboarding.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — must happen before any route logic
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/auth");

  // If not authenticated and on a protected route, redirect to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If authenticated, check for tenant-dependent routes
  if (user) {
    const isOnboarding = pathname === "/onboarding";
    const isTenantRoute =
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/facilities") ||
      pathname.startsWith("/products") ||
      pathname.startsWith("/production") ||
      pathname.startsWith("/inventory") ||
      pathname.startsWith("/settings");

    // For tenant routes, check if user has an org cookie set
    // (Full membership validation happens server-side in page components)
    if (isTenantRoute) {
      const orgCookie = request.cookies.get("frostscale_org_id")?.value;
      if (!orgCookie) {
        // Check if user has any memberships by redirecting to onboarding
        // The onboarding page will check and redirect to dashboard if orgs exist
        const url = request.nextUrl.clone();
        url.pathname = "/onboarding";
        return NextResponse.redirect(url);
      }
    }

    // Redirect authenticated users away from auth pages
    if (pathname.startsWith("/auth")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Redirect root to dashboard for authenticated users
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
