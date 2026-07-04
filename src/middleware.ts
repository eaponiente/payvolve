import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Wire up the Supabase cookie handling layer.
  // To actively refresh sessions here, call supabase.auth.getUser() or
  // supabase.auth.getSession() inside the createClient helper before
  // returning the response.
  return createClient(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
