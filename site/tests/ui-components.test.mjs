import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => {
  await vite.close();
});

async function readCssTree(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const contents = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return readCssTree(entryPath);
      }
      return entry.name.endsWith(".css") ? readFile(entryPath, "utf8") : "";
    }),
  );
  return contents.join("\n");
}

test("emits the app's responsive navigation and motion safeguards", async () => {
  const css = await readCssTree(path.join(root, "dist"));
  assert.match(css, /nav-tabs/);
  assert.match(css, /scrollbar-width:\s*thin/);
  assert.match(css, /scrollbar-gutter:\s*stable/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("forwards progress semantics to the primitive", async () => {
  const { Progress } = await vite.ssrLoadModule("/components/ui/progress.tsx");
  const html = renderToStaticMarkup(React.createElement(Progress, { value: 37 }));

  assert.match(html, /aria-valuenow="37"/);
  assert.match(html, /aria-valuetext="37%"/);
  assert.match(html, /data-state="loading"/);
});

test("emits chart themes for the starter's media dark mode", async () => {
  const { ChartStyle } = await vite.ssrLoadModule("/components/ui/chart.tsx");
  const html = renderToStaticMarkup(
    React.createElement(ChartStyle, {
      id: "contract",
      config: {
        latency: { theme: { light: "#ffffff", dark: "#000000" } },
      },
    }),
  );

  assert.match(html, /\[data-chart=contract\]/);
  assert.match(html, /@media \(prefers-color-scheme: dark\)/);
  assert.doesNotMatch(html, /\.dark/);
});

test("renders sidebar skeletons deterministically", async () => {
  const { SidebarMenuSkeleton } = await vite.ssrLoadModule(
    "/components/ui/sidebar.tsx",
  );
  const first = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));
  const second = renderToStaticMarkup(React.createElement(SidebarMenuSkeleton));

  assert.equal(first, second);
  assert.match(first, /--skeleton-width:70%/);
});

test("masque temporairement le mode pas envie de cuisiner sur l'accueil", async () => {
  const source = await readFile(path.join(root, "components/views/home-view.tsx"), "utf8");
  assert.match(source, /const SHOW_TIRED_MODE = false/);
  assert.match(source, /SHOW_TIRED_MODE && <div className="tired-mode">/);
});

test("permet de retirer un aliment simple du menu", async () => {
  const grid = await readFile(path.join(root, "components/week-grid.tsx"), "utf8");
  const actions = await readFile(path.join(root, "lib/week-menu-actions.ts"), "utf8");
  assert.match(grid, /removeSimpleFood\(dayIndex, "entrée"/);
  assert.match(grid, /removeSimpleFood\(dayIndex, "plat"/);
  assert.match(grid, /removeSimpleFood\(dayIndex, "dessert"/);
  assert.match(actions, /function removeSimpleFoodFromMenu/);
});
