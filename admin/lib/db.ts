import { getCloudflareContext } from "@opennextjs/cloudflare";
import fs from "node:fs";
import path from "node:path";

function getLocalD1File(): string | null {
  const d1Dir = path.resolve(process.cwd(), "../.wrangler/state/v3/d1/miniflare-D1DatabaseObject");
  if (!fs.existsSync(d1Dir)) return null;
  const files = fs.readdirSync(d1Dir)
    .filter(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
    .sort((a, b) => {
      const sizeA = fs.statSync(path.join(d1Dir, a)).size;
      const sizeB = fs.statSync(path.join(d1Dir, b)).size;
      return sizeB - sizeA;
    });
  return files.length > 0 ? path.join(d1Dir, files[0]) : null;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  // 1. Try Cloudflare Context (Production / OpenNext)
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as Record<string, unknown>)?.DB as D1Database | undefined;
    if (db && typeof db.prepare === "function") {
      const res = await db.prepare(sql).bind(...params).all<T>();
      return res.results || [];
    }
  } catch {}

  // 2. Direct local SQLite fallback for next dev server
  const localFile = getLocalD1File();
  if (localFile) {
    try {
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(localFile);
      const stmt = db.prepare(sql);
      const rows = stmt.all(...params) as T[];
      return JSON.parse(JSON.stringify(rows));
    } catch (err) {
      console.error("[Local SQLite Query Error]", err);
    }
  }

  return [];
}

export async function execute(sql: string, params: any[] = []): Promise<{ lastInsertRowid?: number; changes?: number }> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = (env as Record<string, unknown>)?.DB as D1Database | undefined;
    if (db && typeof db.prepare === "function") {
      const res = await db.prepare(sql).bind(...params).run();
      return { lastInsertRowid: res.meta?.last_row_id, changes: res.meta?.changes };
    }
  } catch {}

  const localFile = getLocalD1File();
  if (localFile) {
    try {
      const { DatabaseSync } = await import("node:sqlite");
      const db = new DatabaseSync(localFile);
      const stmt = db.prepare(sql);
      const res = stmt.run(...params);
      return { lastInsertRowid: Number(res.lastInsertRowid), changes: Number(res.changes) };
    } catch (err) {
      console.error("[Local SQLite Exec Error]", err);
    }
  }

  return {};
}

export async function getDb(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  const db = (env as Record<string, unknown>).DB as D1Database | undefined;
  if (!db) throw new Error("D1 database binding 'DB' not available");
  return db;
}

export async function getR2(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as Record<string, unknown>).FILES as R2Bucket | undefined;
  if (!bucket) throw new Error("R2 bucket binding 'FILES' not available");
  return bucket;
}
