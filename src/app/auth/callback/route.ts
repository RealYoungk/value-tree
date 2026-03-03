import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect with error
  return NextResponse.redirect(`${origin}/?error=auth`);
}
