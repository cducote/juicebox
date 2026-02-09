import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const publicRoutes = [
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
];

const isPublicRoute = createRouteMatcher(publicRoutes);

/**
 * Creates a configured Clerk middleware for either admin or customer app.
 * Admin app enforces ADMIN/EMPLOYEE role on all non-public routes.
 * Customer app just requires authentication.
 */
export function createAppMiddleware(options: { requireAdmin?: boolean } = {}) {
  return clerkMiddleware(async (auth, request) => {
    if (isPublicRoute(request)) {
      return NextResponse.next();
    }

    const { userId, sessionClaims } = await auth();

    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Admin app: require ADMIN or EMPLOYEE role
    if (options.requireAdmin) {
      const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;
      if (role !== "ADMIN" && role !== "EMPLOYEE") {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    return NextResponse.next();
  });
}

export { clerkMiddleware, createRouteMatcher };
