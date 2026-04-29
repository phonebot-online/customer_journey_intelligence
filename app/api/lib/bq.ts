import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileP = promisify(execFile);

// In-memory cache so repeated dashboard renders don't re-bill BigQuery for the same query.
// Keyed by full SQL string. Cleared on process restart.
const cache = new Map<string, { data: any[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — fresh enough for dashboard, cheap enough on cost

export async function bqQuery<T = any>(sql: string, opts: { ttlMs?: number; maxRows?: number } = {}): Promise<T[]> {
  const ttl = opts.ttlMs ?? CACHE_TTL_MS;
  const maxRows = opts.maxRows ?? 5000;
  const cached = cache.get(sql);
  if (cached && Date.now() - cached.ts < ttl) return cached.data as T[];

  const args = [
    'query',
    '--use_legacy_sql=false',
    '--format=json',
    `--max_rows=${maxRows}`,
    '--quiet',
    sql,
  ];

  try {
    const { stdout } = await execFileP('bq', args, { maxBuffer: 50 * 1024 * 1024 });
    const data = stdout.trim() ? JSON.parse(stdout) : [];
    cache.set(sql, { data, ts: Date.now() });
    return data as T[];
  } catch (err: any) {
    const msg = err?.stderr || err?.message || String(err);
    throw new Error(`BigQuery query failed: ${msg.slice(0, 500)}`);
  }
}

// Probe BQ by running a trivial query. More reliable than `bq --version` which
// can fail for env-related reasons even when the data path works fine.
let _bqAvailableCache: boolean | null = null;
export async function bqAvailable(): Promise<boolean> {
  if (_bqAvailableCache !== null) return _bqAvailableCache;
  try {
    await bqQuery('SELECT 1 AS ok', { ttlMs: 60_000 });
    _bqAvailableCache = true;
  } catch {
    _bqAvailableCache = false;
  }
  return _bqAvailableCache;
}
