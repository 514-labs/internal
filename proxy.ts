import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/.well-known(.*)", // All .well-known endpoints are public (OAuth, flags, etc. handle their own auth)
  "/mcp(.*)", // MCP endpoint must be publicly accessible for OAuth flow
  "/api/analytics(.*)", // Analytics API endpoints handle their own auth via API keys
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

// Clerk middleware wrapped as the proxy function
const clerkProxy = clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();
  await auth.protect();
});

export function proxy(request: NextRequest) {
  return clerkProxy(request, {} as any);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (Next.js internals)
     * - Static files (html, css, js, images, fonts, etc.)
     */
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};


