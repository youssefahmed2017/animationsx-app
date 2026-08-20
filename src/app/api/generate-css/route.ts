import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCssFromJs } from "@/lib/jsCssGenerator";
import { validateCss } from "@/lib/validateCss";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to generate CSS." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { js } = body as { js?: string };

  if (!js?.trim()) {
    return NextResponse.json({ error: "js is required." }, { status: 400 });
  }

  const result = await generateCssFromJs(js);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  const check = validateCss(result.css);
  if (!check.valid) {
    return NextResponse.json(
      { error: `Generated CSS failed validation: ${check.reason}` },
      { status: 422 }
    );
  }

  return NextResponse.json({ css: result.css });
}
