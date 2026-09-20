export function ownerCanWrite(request: Request) {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLocaleLowerCase("fr-FR");
  const visitorEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLocaleLowerCase("fr-FR");
  const mobileSecret = process.env.MOBILE_SESSION_SECRET;
  const mobileCookie = readCookie(request, "atable_mobile");
  return Boolean(
    (ownerEmail && visitorEmail && ownerEmail === visitorEmail) ||
    (mobileSecret && mobileCookie && safeEqual(mobileSecret, mobileCookie)),
  );
}

export function safeEqual(expected: string, actual: string) {
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ actual.charCodeAt(index);
  }
  return difference === 0;
}

function readCookie(request: Request, name: string) {
  const prefix = `${name}=`;
  const match = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return null;
  }
}

export function writeForbidden() {
  return Response.json(
    { error: "Consultation uniquement — connectez-vous avec le compte propriétaire pour modifier les données." },
    { status: 403 },
  );
}
