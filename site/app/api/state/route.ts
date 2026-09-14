import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { inventory, mealHistory, settings, shopping } from "../../../db/schema";
import { ownerCanWrite, writeForbidden } from "../owner";

function reserveZone(name: string): "frigo" | "congelateur" | "garde-manger" {
  const value = name.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/surgel|glace|nem|epinard|giraumon|palourde|poulet entier|haut de cuisse/.test(value)) return "congelateur";
  if (/lait|yaourt|beurre|creme|oeuf|fromage|mozzarella|emmental|jambon|lard|charcuterie|poireau|poivron/.test(value)) return "frigo";
  return "garde-manger";
}

export async function GET() {
  try {
    const db = getDb();
    const [savedSettings, history, list] = await Promise.all([
      db.select().from(settings),
      db.select().from(mealHistory).orderBy(desc(mealHistory.eatenAt)).limit(30),
      db.select().from(shopping),
    ]);
    return Response.json({ settings: Object.fromEntries(savedSettings.map((item) => [item.key, JSON.parse(item.value)])), history, shopping: list });
  } catch { return Response.json({ settings: {}, history: [], shopping: [], unavailable: true }); }
}

export async function POST(request: Request) {
  if (!ownerCanWrite(request)) return writeForbidden();
  try {
    const body = await request.json() as { action: string; key?: string; value?: unknown; values?: Record<string, unknown>; meal?: string; people?: number; date?: string; name?: string; quantity?: string; zone?: string; id?: number; checked?: boolean; rating?: number; shoppingId?: number; inventoryId?: number; createdShoppingId?: number; previousName?: string; previousQuantity?: string };
    const db = getDb();
    if (body.action === "setting" && body.key) {
      await db.insert(settings).values({ key: body.key, value: JSON.stringify(body.value) }).onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(body.value) } });
      return Response.json({ ok: true });
    }
    if (body.action === "settings" && body.values && typeof body.values === "object") {
      const entries = Object.entries(body.values);
      await Promise.all(entries.map(([key, value]) => db.insert(settings)
        .values({ key, value: JSON.stringify(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: JSON.stringify(value) } })));
      return Response.json({ ok: true, saved: entries.length });
    }
    if (body.action === "meal" && body.meal) {
      const date = body.date || new Date().toISOString().slice(0, 10);
      if (body.meal === "Repas à l’extérieur / commandé") {
        const [existing] = await db.select().from(mealHistory).where(and(eq(mealHistory.meal, body.meal), eq(mealHistory.eatenAt, date))).limit(1);
        if (existing) return Response.json({ item: existing, duplicate: true });
      }
      const [item] = await db.insert(mealHistory).values({ meal: body.meal, people: body.people || 3, eatenAt: date, rating: body.rating && [1, 2, 3].includes(Number(body.rating)) ? Number(body.rating) : 3 }).returning();
      return Response.json({ item });
    }
    if (body.action === "delete-meal" && (body.id || (body.meal && body.date))) {
      if (body.id) await db.delete(mealHistory).where(eq(mealHistory.id, body.id));
      else await db.delete(mealHistory).where(and(eq(mealHistory.meal, body.meal!), eq(mealHistory.eatenAt, body.date!)));
      return Response.json({ ok: true });
    }
    if (body.action === "rate-meal" && body.id && [1, 2, 3].includes(Number(body.rating))) {
      await db.update(mealHistory).set({ rating: Number(body.rating) }).where(eq(mealHistory.id, body.id));
      return Response.json({ ok: true });
    }
    if (body.action === "shopping" && body.name) {
      const [item] = await db.insert(shopping).values({ name: body.name, quantity: body.quantity || "1" }).returning();
      return Response.json({ item });
    }
    if (body.action === "update-shopping" && body.id && body.name) {
      await db.update(shopping).set({ name: body.name.trim(), quantity: body.quantity || "1" }).where(eq(shopping.id, body.id));
      return Response.json({ ok: true });
    }
    if (body.action === "check" && body.id) {
      const [current] = await db.select().from(shopping).where(eq(shopping.id, body.id)).limit(1);
      if (!current) return Response.json({ error: "Article introuvable" }, { status: 404 });
      const justBought = Boolean(body.checked) && !current.checked;
      await db.update(shopping).set({ checked: Boolean(body.checked) }).where(eq(shopping.id, body.id));
      if (justBought) {
        const [item] = await db.insert(inventory).values({ name: current.name, quantity: current.quantity, zone: reserveZone(current.name) }).returning();
        return Response.json({ ok: true, inventoryItem: item });
      }
      return Response.json({ ok: true });
    }
    if (body.action === "scan-purchase" && body.name) {
      let previousShopping = null;
      let shoppingItem = null;
      if (body.shoppingId) {
        const [current] = await db.select().from(shopping).where(eq(shopping.id, body.shoppingId)).limit(1);
        if (current) {
          previousShopping = current;
          [shoppingItem] = await db.update(shopping).set({ name: body.name.trim(), quantity: body.quantity || current.quantity, checked: true }).where(eq(shopping.id, current.id)).returning();
        }
      }
      if (!shoppingItem) {
        [shoppingItem] = await db.insert(shopping).values({ name: body.name.trim(), quantity: body.quantity || "1", checked: true }).returning();
      }
      const selectedZone = ["frigo", "congelateur", "garde-manger", "epices"].includes(body.zone || "")
        ? body.zone as "frigo" | "congelateur" | "garde-manger" | "epices"
        : reserveZone(body.name);
      const [inventoryItem] = await db.insert(inventory).values({ name: body.name.trim(), quantity: body.quantity || "1", zone: selectedZone }).returning();
      return Response.json({ ok: true, inventoryItem, shoppingItem, previousShopping });
    }
    if (body.action === "undo-scan-purchase" && body.inventoryId) {
      await db.delete(inventory).where(eq(inventory.id, body.inventoryId));
      if (body.createdShoppingId) await db.delete(shopping).where(eq(shopping.id, body.createdShoppingId));
      if (body.shoppingId && body.previousName) {
        await db.update(shopping).set({ name: body.previousName, quantity: body.previousQuantity || "1", checked: false }).where(eq(shopping.id, body.shoppingId));
      }
      return Response.json({ ok: true });
    }
    if (body.action === "delete-shopping" && body.id) {
      await db.delete(shopping).where(eq(shopping.id, body.id));
      return Response.json({ ok: true });
    }
    if (body.action === "clear-bought-shopping") {
      await db.delete(shopping).where(eq(shopping.checked, true));
      return Response.json({ ok: true });
    }
    if (body.action === "reset-shopping") {
      await db.delete(shopping);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Action invalide" }, { status: 400 });
  } catch { return Response.json({ error: "Enregistrement impossible" }, { status: 500 }); }
}
