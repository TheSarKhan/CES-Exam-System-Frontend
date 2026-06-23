import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_PATHS = ["/dashboard", "/departments", "/users", "/question-bank", "/reports"];
const ADMIN_EXAM_PATHS = ["/exams/create", "/exams/assign"];

function decodeRoles(token: string): string[] {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (Array.isArray(payload.roles)) return payload.roles;
    if (typeof payload.role === "string") return [payload.role];
    return [];
  } catch {
    return [];
  }
}

function hasRole(roles: string[], role: string) {
  return roles.includes(role) || roles.includes(`ROLE_${role}`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ces_token")?.value;

  const isProtected =
    pathname === "/dashboard" ||
    pathname.startsWith("/employee") ||
    ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname === "/exams" ||
    ADMIN_EXAM_PATHS.some((p) => pathname.startsWith(p));

  if (!isProtected) return NextResponse.next();

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const roles = decodeRoles(token);
  const isAdminRoute =
    ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname === "/exams" ||
    ADMIN_EXAM_PATHS.some((p) => pathname.startsWith(p));

  if (isAdminRoute && !hasRole(roles, "ADMIN")) {
    return NextResponse.redirect(new URL("/employee/dashboard", request.url));
  }

  if (pathname.startsWith("/employee") && !hasRole(roles, "EMPLOYEE") && !hasRole(roles, "CANDIDATE") && !hasRole(roles, "ADMIN")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/employee/:path*",
    "/departments/:path*",
    "/users/:path*",
    "/question-bank/:path*",
    "/reports/:path*",
    "/exams/:path*",
  ],
};
