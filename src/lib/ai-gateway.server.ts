import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export function createLovableAiGatewayProvider(lovableApiKey: string, initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  let resolveRunId: (value: string | undefined) => void = () => {};
  let runIdResolved = false;
  const runIdReady = new Promise<string | undefined>((resolve) => {
    resolveRunId = resolve;
  });

  const publishRunId = (value?: string) => {
    const nextRunId = value?.trim() || undefined;
    if (!runId && nextRunId) runId = nextRunId;
    if (!runIdResolved) {
      runIdResolved = true;
      resolveRunId(runId);
    }
  };
  if (runId) publishRunId(runId);

  const provider = createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: {
      "Lovable-API-Key": lovableApiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRunId(response.headers.get(LOVABLE_AIG_RUN_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRunId(undefined);
        throw error;
      }
    },
  });

  return Object.assign(provider, {
    getRunId: () => runId,
    waitForRunId: () => (runId ? Promise.resolve(runId) : runIdReady),
  });
}

export async function appendLeadRow(values: (string | number)[]): Promise<void> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.LEADS_SHEET_ID ?? "1YbvY6Ppi1SGM8rCKTcc9XKGW3KvOxF2bYFIBADRivyY";
  const tab = process.env.LEADS_SHEET_TAB ?? "Leads";

  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  if (!sheetsKey) throw new Error("Missing GOOGLE_SHEETS_API_KEY");

  const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${sheetId}/values/${tab}!A:Z:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
    },
    body: JSON.stringify({ values: [values] }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets append failed: ${res.status} ${body}`);
  }
}

type LeadCache = {
  keys: Set<string>;
  rowCount: number;
  fetchedAt: number;
};

let leadCache: LeadCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export function addLeadKeyToCache(key: string) {
  if (leadCache) {
    leadCache.keys.add(key);
    leadCache.rowCount += 1;
  }
}

export function invalidateLeadCache() {
  leadCache = null;
}

/**
 * Devuelve el set de claves normalizadas de leads existentes.
 * Usa caché en memoria con TTL para evitar releer toda la hoja en cada save_lead.
 */
export async function getLeadKeySet(
  buildKey: (nombre: string, patologia: string) => string,
): Promise<Set<string>> {
  const now = Date.now();
  if (leadCache && now - leadCache.fetchedAt < CACHE_TTL_MS) {
    return leadCache.keys;
  }

  const rows = await fetchLeadRows();
  const keys = new Set<string>();
  rows.forEach((r, idx) => {
    if (idx === 0 && (r[1] ?? "").toLowerCase().includes("nombre")) return;
    const nombre = r[1] ?? "";
    const patologia = r[2] ?? "";
    if (nombre && patologia) keys.add(buildKey(nombre, patologia));
  });

  leadCache = { keys, rowCount: rows.length, fetchedAt: now };
  return keys;
}

export async function fetchLeadRows(): Promise<string[][]> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetId = process.env.LEADS_SHEET_ID ?? "1YbvY6Ppi1SGM8rCKTcc9XKGW3KvOxF2bYFIBADRivyY";
  const tab = process.env.LEADS_SHEET_TAB ?? "Leads";

  if (!lovableKey) throw new Error("Missing LOVABLE_API_KEY");
  if (!sheetsKey) throw new Error("Missing GOOGLE_SHEETS_API_KEY");

  // Solo leemos columnas B (nombre) y C (patología) — suficiente para la deduplicación
  // y reduce drásticamente el payload vs leer A:J.
  const url = `https://connector-gateway.lovable.dev/google_sheets/v4/spreadsheets/${sheetId}/values/${tab}!B:C`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": sheetsKey,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Sheets read failed: ${res.status} ${body}`);
  }
  const data = (await res.json()) as { values?: string[][] };
  // Normalizamos a [_, nombre, patologia] para mantener compatibilidad con los índices [1] y [2]
  return (data.values ?? []).map((r) => ["", r[0] ?? "", r[1] ?? ""]);
}