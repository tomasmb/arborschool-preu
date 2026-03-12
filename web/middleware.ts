import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildSignInUrlWithCallback } from "@/lib/auth/callbackUrl";

export default auth((request) => {
  const isAuthenticated = Boolean(request.auth?.user);
  const { pathname, search } = request.nextUrl;

  if (!isAuthenticated && pathname.startsWith("/api/student/")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!isAuthenticated && pathname.startsWith("/portal")) {
    const signInPath = buildSignInUrlWithCallback(`${pathname}${search}`);
    return NextResponse.redirect(new URL(signInPath, request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/portal/:path*", "/api/student/:path*"],
};
