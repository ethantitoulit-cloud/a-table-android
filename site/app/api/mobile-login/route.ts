import { safeEqual } from "../owner";

export async function POST(request: Request) {
  const configuredPin = process.env.MOBILE_PIN;
  const sessionSecret = process.env.MOBILE_SESSION_SECRET;
  if (!configuredPin || !sessionSecret) {
    return Response.json({ error: "Accès mobile indisponible." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { pin?: unknown } | null;
  const pin = typeof body?.pin === "string" ? body.pin.trim() : "";
  if (!safeEqual(configuredPin, pin)) {
    return Response.json({ error: "Code incorrect." }, { status: 401 });
  }

  return Response.json(
    { canEdit: true },
    {
      headers: {
        "Set-Cookie": `atable_mobile=${encodeURIComponent(sessionSecret)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,
        "Cache-Control": "no-store",
      },
    },
  );
}
