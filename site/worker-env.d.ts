declare module "cloudflare:workers" {
  export const env: { DB?: D1Database };
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface D1Database {
  prepare(query: string): import("@cloudflare/workers-types").D1PreparedStatement;
  batch<T = unknown>(statements: unknown[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
  dump(): Promise<ArrayBuffer>;
}
