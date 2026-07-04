import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.DATABASE_URL ?? null;
  return NextResponse.json({
    hasDatabaseUrl: !!url,
    databaseUrlLength: url?.length ?? 0,
    databaseUrlPrefix: url ? `${url.substring(0, 25)}...` : null,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    hasAuthSecret: !!process.env.AUTH_SECRET,
    hasTrustHost: !!process.env.AUTH_TRUST_HOST,
  });
}
