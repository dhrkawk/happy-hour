// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/infra/supabase/shared/server";
import { SupabaseUserProfileRepository } from "@/infra/supabase/repository/profile.repo.supabase";

export async function GET() {
  const sb = await createClient();
  const repo = new SupabaseUserProfileRepository(sb);

  try {
    const profile = await repo.getUserProfile();
    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to fetch profile" },
      { status: 500 }
    );
  }
}