import { getCheck } from "@/lib/db";
import { hasSecondLook } from "@/lib/entitlements";
import { getSessionUser } from "@/lib/session";
import { briefPdf } from "@/lib/brief-pdf";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const check = await getCheck(id, user.id);
  if (!check) return Response.json({ error: "not found" }, { status: 404 });
  if (!check.payload.brief || !(await hasSecondLook(user.id).catch(() => false))) return Response.json({ error: "brief not unlocked" }, { status: 402 });
  return new Response(briefPdf(check), { headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `${new URL(req.url).searchParams.has("download") ? "attachment" : "inline"}; filename="secondlook-${check.id.slice(-8)}.pdf"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}
