import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({
    user,
    keys: {
      linkup: Boolean(process.env.LINKUP_API_KEY),
      nebius: Boolean(process.env.NEBIUS_API_KEY),
      revenuecat: Boolean(process.env.NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY),
    },
  });
}
