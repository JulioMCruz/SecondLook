import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    product: "SecondLook",
    keys: {
      linkup: Boolean(process.env.LINKUP_API_KEY),
      nebius: Boolean(process.env.NEBIUS_API_KEY),
      revenuecat: Boolean(process.env.NEXT_PUBLIC_REVENUECAT_TEST_STORE_API_KEY),
      resend: Boolean(process.env.RESEND_API_KEY),
    },
  });
}
