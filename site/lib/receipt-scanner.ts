export type InventoryZone = "frigo" | "congelateur" | "garde-manger" | "epices";

export const INVENTORY_ZONE_LABELS: Record<InventoryZone, string> = {
  frigo: "Réfrigérateur",
  congelateur: "Congélateur",
  "garde-manger": "Placard",
  epices: "Épices",
};

export type ReceiptScanRow = {
  id: string;
  name: string;
  quantity: string;
  zone: InventoryZone;
  uncertain?: boolean;
};

export const receiptProducts = (rawText: string) => {
  const ignored = /(?:total|sous.?total|tva|ticket|carte|esp[eè]ces|rendu|paiement|merci|fid[eé]lit[eé]|magasin|caisse|caissier|date|heure|siret|ape|adresse|t[eé]l[eé]phone|www\.|€|eur|montant|article|solde|avoir|price|prix)/i;
  const nonFood = /(?:liquide\s+vaisselle|lave.?vaisselle|lessive|adoucissant|javel|nettoyant|d[eé]tergent|d[eé]sinfectant|essuie.?tout|papier\s+(?:toilette|hygi[eé]nique)|mouchoirs?|sacs?\s+poubelle|film\s+[eé]tirable|papier\s+aluminium|[eé]ponge|savon|shampooing|gel\s+douche|dentifrice|d[eé]odorant|protection\s+hygi[eé]nique|couches?|liti[eè]re|croquettes?|p[aâ]t[eé]e?\s+(?:pour\s+)?(?:chat|chien)|aliment\s+(?:pour\s+)?(?:chat|chien)|(?:chat|chien)\s+(?:adulte|junior|senior))/i;
  const cleaned = rawText
    .split(/\r?\n/)
    .filter((line) => {
      const letters = line.match(/\p{L}/gu) || [];
      const uppercase = line.match(/\p{Lu}/gu) || [];
      const compactLength = line.replace(/\s/g, "").length || 1;
      return letters.length >= 4 && letters.length / compactLength >= .55 && uppercase.length / letters.length >= .55;
    })
    .map((line) => line
      .replace(/^\s*(?:\d{8,}|[*#=:_-]+)\s*/g, "")
      .replace(/\s+(?:\d+[,.]\d{2}|\d+[,.]\d{2}\s*[a-z]?)\s*$/i, "")
      .replace(/^\s*\d+\s*[x×]\s*/i, "")
      .replace(/[^\p{L}\p{N}\s'’&+%.-]/gu, " ")
      .replace(/\s{2,}/g, " ")
      .trim())
    .filter((line) => line.length >= 3 && /\p{L}{2}/u.test(line) && !ignored.test(line));
  const products = cleaned.filter((line) => !nonFood.test(line));
  const unique = [...new Set(products)];
  const sourceLetters = (rawText.match(/\p{L}/gu) || []).length;
  const retainedLetters = unique.join("").match(/\p{L}/gu)?.length || 0;
  const reliable = unique.length >= 3 && retainedLetters / Math.max(1, sourceLetters) >= .18;
  return { text: reliable ? unique.join("\n") : "", excluded: cleaned.length - products.length, reliable };
};

export const inventoryZoneFor = (name: string): InventoryZone => {
  const value = name.toLocaleLowerCase("fr-FR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (/(surgele|glace|sorbet|frites|legumes.*surg|poisson.*surg|viande.*surg)/.test(value)) return "congelateur";
  if (/(epice|poivre|sel\b|piment|paprika|curry|curcuma|cumin|cannelle|muscade|vanille|thym|laurier|herbe|bouillon)/.test(value)) return "epices";
  if (/(yaourt|lait\b|beurre|creme|fromage|emmental|mozzarella|oeuf|jambon|saucis|charcut|viande|poulet|boeuf|porc|poisson|saumon|morue|cabillaud|tortelloni|ravioli frais|tomate cerise|salade|laitue|concombre|courgette|carotte|poireau|christophine|aubergine|poivron|citron|pomme|poire|prune|raisin|fraise)/.test(value)) return "frigo";
  return "garde-manger";
};

export const scanRowsFromText = (text: string): ReceiptScanRow[] => text
  .split(/\n|,|;/)
  .map((value, index) => {
    const line = value.replace(/^[-•✓\s]+/, "").trim();
    const packageQuantity = line.match(/\b\d+\s*[x×]\s*\d+(?:[,.]\d+)?\s*(?:kg|g|ml|cl|l)\b/i)?.[0];
    const measuredQuantity = packageQuantity || line.match(/\b\d+(?:[,.]\d+)?\s*(?:kg|g|ml|cl|l)\b/i)?.[0];
    const countQuantity = !measuredQuantity ? line.match(/^\s*(\d+)\s*[x×]\s+/i)?.[1] : undefined;
    const quantity = measuredQuantity || countQuantity || "1";
    const name = line
      .replace(packageQuantity || "$^", "")
      .replace(!measuredQuantity && countQuantity ? /^\s*\d+\s*[x×]\s+/i : /$^/, "")
      .replace(/\s{2,}/g, " ")
      .trim();
    return { id: `${Date.now()}-${index}`, name, quantity, zone: inventoryZoneFor(name), uncertain: !measuredQuantity && !countQuantity };
  })
  .filter((row) => row.name.length >= 2);

const receiptImageForOcr = async (file: File) => {
  const image = await createImageBitmap(file);
  try {
    const cropWidth = Math.round(image.width * .88);
    const cropHeight = Math.round(image.height * .98);
    const sourceX = Math.round((image.width - cropWidth) / 2);
    const sourceY = Math.round((image.height - cropHeight) / 2);
    const scale = Math.max(1, Math.min(3, 1800 / cropWidth));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(cropWidth * scale);
    canvas.height = Math.round(cropHeight * scale);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return file;
    context.filter = "grayscale(1) contrast(1.35) brightness(1.06)";
    context.drawImage(image, sourceX, sourceY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    image.close();
  }
};

export async function recognizeReceiptFile(file: File, onProgress: (message: string) => void) {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const Detector = (window as unknown as { TextDetector?: new () => { detect: (source: ImageBitmap) => Promise<{ rawValue: string }[]> } }).TextDetector;
  if (Detector && !isPdf) {
    const bitmap = await createImageBitmap(file);
    try {
      const blocks = await new Detector().detect(bitmap);
      return blocks.map((block) => block.rawValue).join("\n");
    } finally {
      bitmap.close();
    }
  }

  if (isPdf) {
    onProgress("Lecture rapide du PDF…");
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const loadingTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const pdf = await loadingTask.promise;
    const pageCount = Math.min(pdf.numPages, 5);
    try {
      const embeddedTexts: string[] = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        embeddedTexts.push(content.items.map((item) => "str" in item ? item.str : "").join("\n"));
        page.cleanup();
      }
      const embeddedText = embeddedTexts.join("\n");
      if (receiptProducts(embeddedText).reliable) return embeddedText;

      onProgress("Le PDF est une image : reconnaissance du ticket…");
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("fra", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") onProgress(`Lecture du ticket… ${Math.round((message.progress || 0) * 100)} %`);
        },
      });
      await worker.setParameters({ preserve_interword_spaces: "1", tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      const texts: string[] = [];
      try {
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        onProgress(`Lecture de la page ${pageNumber}/${pageCount}…`);
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = window.document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext("2d");
        if (!context) continue;
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        texts.push((await worker.recognize(canvas)).data.text);
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
      }
      return texts.join("\n");
      } finally {
        await worker.terminate();
      }
    } finally {
      await loadingTask.destroy();
    }
  }

  onProgress("Lecture du ticket… Cela peut prendre quelques secondes.");
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("fra", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") onProgress(`Lecture du ticket… ${Math.round((message.progress || 0) * 100)} %`);
    },
  });
  try {
    await worker.setParameters({ preserve_interword_spaces: "1", tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    return (await worker.recognize(await receiptImageForOcr(file))).data.text;
  } finally {
    await worker.terminate();
  }
}
