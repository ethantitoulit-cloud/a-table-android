export function ownerCanWrite(request: Request) {
  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLocaleLowerCase("fr-FR");
  const visitorEmail = request.headers.get("oai-authenticated-user-email")?.trim().toLocaleLowerCase("fr-FR");
  return Boolean(ownerEmail && visitorEmail && ownerEmail === visitorEmail);
}

export function writeForbidden() {
  return Response.json(
    { error: "Consultation uniquement — connectez-vous avec le compte propriétaire pour modifier les données." },
    { status: 403 },
  );
}
