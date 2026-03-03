import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const isAuthenticated = Boolean(request.auth?.user);
  const { pathname, search } = request.nextUrl;
  const isStudentPortalEnabled = process.env.STUDENT_PORTAL_V1 !== "false";

  if (!isStudentPortalEnabled && pathname.startsWith("/api/student/")) {
    return NextResponse.json(
      { success: false, error: "Student portal is disabled" },
      { status: 404 }
    );
  }

  if (!isStudentPortalEnabled && pathname.startsWith("/portal")) {
    const diagnosticUrl = new URL("/diagnostico", request.url);
    return NextResponse.redirect(diagnosticUrl);
  }

  if (!isAuthenticated && pathname.startsWith("/api/student/")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!isAuthenticated && pathname.startsWith("/portal")) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/portal/:path*", "/api/student/:path*"],
};
