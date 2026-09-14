import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { inventory } from "../../../db/schema";
import { ownerCanWrite, writeForbidden } from "../owner";

export async function GET() {
  try { return Response.json({ items: await getDb().select().from(inventory).orderBy(asc(inventory.name)) }); }
  catch { return Response.json({ items: [], unavailable: true }); }
}

export async function POST(request: Request) {
  if (!ownerCanWrite(request)) return writeForbidden();
  try {
    const body = await request.json() as { name?: string; quantity?: string; zone?: "frigo" | "congelateur" | "garde-manger" | "epices"; expires?: string; items?: Array<{ id?: number; name?: string; quantity?: string; zone?: "frigo" | "congelateur" | "garde-manger" | "epices"; expires?: string | null }> };
    if (Array.isArray(body.items)) {
      if (!body.items.length || body.items.length > 200 || body.items.some((item) => !item.name?.trim()))
        return Response.json({ error: "Liste invalide" }, { status: 400 });
      const db = getDb();
      const statements = body.items.map((item) => item.id && item.id > 0
        ? db.update(inventory).set({ name: item.name!.trim(), quantity: item.quantity || "1", zone: item.zone || "garde-manger", expires: item.expires || null }).where(eq(inventory.id, item.id))
        : db.insert(inventory).values({ name: item.name!.trim(), quantity: item.quantity || "1", zone: item.zone || "garde-manger", expires: item.expires || null }));
      await db.batch(statements as [typeof statements[number], ...Array<typeof statements[number]>]);
      return Response.json({ items: await db.select().from(inventory).orderBy(asc(inventory.name)) }, { status: 201 });
    }
    if (!body.name?.trim()) return Response.json({ error: "Nom requis" }, { status: 400 });
    const [item] = await getDb().insert(inventory).values({ name: body.name.trim(), quantity: body.quantity || "1", zone: body.zone || "garde-manger", expires: body.expires || null }).returning();
    return Response.json({ item }, { status: 201 });
  } catch { return Response.json({ error: "Impossible d’ajouter ce produit" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  if (!ownerCanWrite(request)) return writeForbidden();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: "Identifiant invalide" }, { status: 400 });
  try { await getDb().delete(inventory).where(eq(inventory.id, id)); return new Response(null, { status: 204 }); }
  catch { return Response.json({ error: "Impossible de supprimer ce produit" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  if (!ownerCanWrite(request)) return writeForbidden();
  try {
    const body = await request.json() as { id?: number; name?: string; quantity?: string; zone?: "frigo" | "congelateur" | "garde-manger" | "epices"; expires?: string | null };
    if (!body.id) return Response.json({ error: "Identifiant requis" }, { status: 400 });
    const [item] = await getDb().update(inventory).set({ name: body.name, quantity: body.quantity, zone: body.zone, expires: body.expires || null }).where(eq(inventory.id, body.id)).returning();
    return Response.json({ item });
  } catch { return Response.json({ error: "Modification impossible" }, { status: 500 }); }
}
