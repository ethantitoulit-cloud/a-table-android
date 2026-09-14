import { asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { simpleFoods } from "../../../db/schema";
import { ownerCanWrite, writeForbidden } from "../owner";

const normalize = (value: string) => value.toLocaleLowerCase("fr-FR").replace(/œ/g, "oe").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const retiredPreloadedIds = new Set(["simple_laitue", "simple_concombre", "simple_avocat", "simple_mandarine", "simple_banane", "simple_yaourt"]);
const nutritionGroup = (name: string) => {
  const value = normalize(name);
  if (/(laitue|salade|tomate|concombre|avocat|carotte|betterave|chou|radis|legume)/.test(value)) return "légumes";
  if (/(pomme|poire|banane|mandarine|clementine|orange|mangue|ananas|papaye|goyave|fruit|raisin|melon|pasteque)/.test(value)) return "fruit";
  if (/(yaourt|fromage blanc|lait)/.test(value)) return "produit laitier";
  return "autre";
};

export async function GET() {
  try {
    const db = getDb();
    const items = await db.select({
      id: simpleFoods.id,
      name: simpleFoods.name,
      course: simpleFoods.course,
      quantityPerPerson: simpleFoods.quantityPerPerson,
      nutritionGroup: simpleFoods.nutritionGroup,
      optionalSeasoning: simpleFoods.optionalSeasoning,
    }).from(simpleFoods).where(eq(simpleFoods.status, "active")).orderBy(asc(simpleFoods.course), asc(simpleFoods.name));
    return Response.json({ items: items.filter((item) => !retiredPreloadedIds.has(item.id)) });
  } catch {
    return Response.json({ items: [], unavailable: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!ownerCanWrite(request)) return writeForbidden();
  try {
    const body = await request.json() as { name?: string; course?: "entrée" | "plat" | "dessert"; quantityPerPerson?: string };
    const name = body.name?.trim();
    const course = body.course;
    if (!name || !course || !["entrée", "plat", "dessert"].includes(course)) return Response.json({ error: "Aliment invalide" }, { status: 400 });
    const normalizedName = normalize(name);
    const now = new Date().toISOString();
    const db = getDb();
    const [item] = await db.insert(simpleFoods).values({
      id: `simple_${normalizedName}_${course}`,
      name,
      normalizedName: `${normalizedName}-${course}`,
      course,
      quantityPerPerson: body.quantityPerPerson?.trim() || "1 unité",
      nutritionGroup: nutritionGroup(name),
      createdAt: now,
      updatedAt: now,
    }).onConflictDoUpdate({ target: simpleFoods.id, set: { name, quantityPerPerson: body.quantityPerPerson?.trim() || "1 unité", nutritionGroup: nutritionGroup(name), status: "active", updatedAt: now } }).returning();
    return Response.json({ item });
  } catch {
    return Response.json({ error: "Impossible d’ajouter cet aliment" }, { status: 500 });
  }
}
