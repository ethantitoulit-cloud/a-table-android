export async function GET(request: Request) {
  const barcode = new URL(request.url).searchParams.get("barcode")?.replace(/\D/g, "") || "";
  if (!/^\d{8,14}$/.test(barcode)) return Response.json({ error: "Code-barres invalide" }, { status: 400 });
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=code,product_name,brands,quantity`, {
      headers: { "User-Agent": "Qu-est-ce-qu-on-mange/1.0 (personal meal planner)" },
    });
    if (!response.ok) return Response.json({ error: "Produit introuvable" }, { status: 404 });
    const data = await response.json() as { status?: number; product?: { product_name?: string; brands?: string; quantity?: string } };
    if (data.status !== 1 || !data.product?.product_name) return Response.json({ error: "Produit introuvable" }, { status: 404 });
    const brand = data.product.brands?.split(",")[0]?.trim() || "";
    const productName = data.product.product_name.trim();
    const name = brand && !productName.toLocaleLowerCase("fr-FR").includes(brand.toLocaleLowerCase("fr-FR")) ? `${brand} · ${productName}` : productName;
    return Response.json({ barcode, name, quantity: data.product.quantity?.trim() || null });
  } catch {
    return Response.json({ error: "Recherche du produit indisponible" }, { status: 503 });
  }
}
