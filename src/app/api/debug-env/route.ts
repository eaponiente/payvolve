import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? null;

  let databaseUrlHost: string | null = null;
  let databaseUrlPort: string | null = null;
  let databaseUrlUser: string | null = null;
  let databaseUrlParseError: string | null = null;
  if (url) {
    try {
      const parsed = new URL(url);
      databaseUrlHost = parsed.hostname;
      databaseUrlPort = parsed.port || null;
      databaseUrlUser = parsed.username || null;
    } catch (err) {
      databaseUrlParseError = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({
    hasDatabaseUrl: !!url,
    databaseUrlLength: url?.length ?? 0,
    databaseUrlHost,
    databaseUrlPort,
    databaseUrlUser,
    databaseUrlParseError,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasTrustHost: !!process.env.AUTH_TRUST_HOST,
  });
}
