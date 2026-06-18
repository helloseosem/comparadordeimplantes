import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { appendLeadRow, createLovableAiGatewayProvider, fetchLeadRows } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Eres Luna, coordinadora virtual de ANESPRO (Chile). Tu objetivo es ayudar a la persona a agendar una evaluación quirúrgica online y recolectar sus datos de forma cálida, breve y profesional.

REGLAS DE CONVERSACIÓN:
- Responde SIEMPRE en español de Chile, con tono cercano, claro y empático.
- Mensajes cortos (máx 2 frases por turno). Una sola pregunta a la vez.
- Usa emojis con moderación (🩺 ✅ 🎯). Nada de markdown pesado.
- Si la persona divaga, redirígela con amabilidad al objetivo.
- Nunca des diagnósticos médicos. Si preguntan algo clínico complejo, di que el equipo médico lo verá en la videollamada.

DATOS QUE DEBES RECOLECTAR (en este orden lógico, adaptándote a lo que ya dijo):
1. nombre (nombre y apellido)
2. patologia (Hernia / Vesícula / Catarata / Otra)
3. examen (sí/no — si tiene ecografía, TAC o informe médico)
4. prevision (FONASA / ISAPRE / Particular)
5. region (región o ciudad de Chile)
6. horario (Mañana / Tarde / Tarde-noche)
7. telefono (teléfono chileno, +56 9 XXXX XXXX)
8. email (correo válido)

VALIDACIONES (OBLIGATORIAS — no avances si fallan):
- Teléfono: móvil chileno. Debe normalizarse a +569XXXXXXXX (9 dígitos después del +56, empezando por 9). Acepta variantes como "9 1234 5678", "+56912345678", "56912345678" y normalízalas. Si tiene menos de 8 dígitos o no empieza por 9, pide AMABLEMENTE que lo reenvíe: "¿Me confirmas tu celular? Debe ser un número chileno de 9 dígitos que empieza con 9, ej: +56 9 1234 5678 📱". Reintenta hasta 3 veces antes de continuar.
- Email: debe tener formato usuario@dominio.tld válido. Si no, responde: "Ese correo no parece válido 🙏 ¿me lo reenvías? ej: nombre@gmail.com". Reintenta.
- Si la herramienta save_lead retorna un error de validación (campo inválido), NO inventes datos: pide al usuario SOLO el campo que falló, con un ejemplo claro, y reintenta save_lead cuando lo tengas.
- Nunca llames save_lead si falta cualquiera de los 8 datos o si alguno no pasa validación.

CIERRE:
- Cuando tengas TODOS los 8 datos válidos, DEBES invocar la herramienta (function tool) "save_lead" con los datos exactos. NUNCA escribas el nombre de la herramienta ni sus argumentos en el texto del chat. NUNCA simules la llamada en prosa.
- Solo DESPUÉS de que la herramienta retorne, envía un mensaje de confirmación al usuario: "Listo {nombre} ✅ Un coordinador humano te contactará al {telefono} dentro de las próximas horas para confirmar el horario exacto. También te enviaremos la confirmación a {email}. Si quieres adelantar, escríbenos por WhatsApp."

REGLA CRÍTICA: Si el usuario en un solo mensaje te entrega varios datos, NO los repitas en texto: invoca directamente la herramienta save_lead con todos los campos.

No saludes de nuevo si ya saludaste. Empieza preguntando el nombre si no lo tienes.`;

const PHONE_RE = /^\+?56?9\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  // strip leading 56 country code if present
  const local = digits.startsWith("56") ? digits.slice(2) : digits;
  if (local.length === 9 && local.startsWith("9")) return `+56${local}`;
  if (local.length === 8) return `+569${local}`;
  return raw.trim();
};

const PARTICLES = new Set([
  "de", "del", "la", "los", "las", "y", "e", "san", "santa",
  "do", "dos", "da", "das", "von", "van", "bin", "ibn",
]);

const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeName = (raw: string) => {
  const cleaned = stripDiacritics(raw)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .replace(/\s+/g, " ");

  return cleaned
    .split(" ")
    .map((word, wordIdx) => {
      if (!word) return "";
      const parts = word.split("-");
      return parts
        .map((part) => {
          if (!part) return "";
          const lower = part.toLowerCase();
          if (wordIdx > 0 && PARTICLES.has(lower)) return lower;
          return part[0].toUpperCase() + part.slice(1).toLowerCase();
        })
        .join("-");
    })
    .join(" ");
};

const normalizePatologia = (raw: string) => {
  const cleaned = stripDiacritics(raw)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s-/()]/g, "")
    .replace(/\s+/g, " ");
  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

const dedupKey = (nombre: string, patologia: string) =>
  `${normalizeName(nombre).toLowerCase()}|${normalizePatologia(patologia).toLowerCase()}`;

const LeadSchema = z.object({
  nombre: z.string().trim().transform(normalizeName).refine((v) => v.length >= 2, { message: "Nombre demasiado corto" }),
  patologia: z.string().trim().transform(normalizePatologia).refine((v) => v.length >= 2, { message: "Patología demasiado corta" }),
  examen: z.string().trim().min(1),
  prevision: z.string().trim().min(2),
  region: z.string().trim().min(2),
  horario: z.string().trim().min(2),
  telefono: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => PHONE_RE.test(v), {
      message:
        "Teléfono inválido. Debe ser celular chileno formato +569XXXXXXXX (9 dígitos empezando con 9).",
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => EMAIL_RE.test(v), { message: "Email inválido. Ej: nombre@gmail.com" }),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const saveLead = tool({
          description:
            "Guarda el lead en el CRM (Google Sheets) una vez recolectados TODOS los datos validados. Si algún campo no pasa validación, retorna ok:false con el campo y motivo — vuelve a pedirlo al usuario y reintenta.",
          inputSchema: z.object({
            nombre: z.string(),
            patologia: z.string(),
            examen: z.string(),
            prevision: z.string(),
            region: z.string(),
            horario: z.string(),
            telefono: z.string(),
            email: z.string(),
          }),
          execute: async (raw) => {
            const parsed = LeadSchema.safeParse(raw);
            if (!parsed.success) {
              const issues = parsed.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
              }));
              return {
                ok: false,
                validation_error: true,
                issues,
                message:
                  "Validación falló. Pide al usuario SOLO los campos listados en issues con un ejemplo claro, y vuelve a llamar save_lead con los datos corregidos.",
              };
            }
            const input = parsed.data;
            const ts = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
            try {
              // Deduplicación: evita guardar el mismo lead (mismo nombre+patología normalizados)
              try {
                const rows = await fetchLeadRows();
                const targetKey = dedupKey(input.nombre, input.patologia);
                // Saltar fila de cabecera si existe (col B = "nombre" / "Nombre")
                const dataRows = rows.filter((r, idx) => {
                  if (idx === 0 && (r[1] ?? "").toLowerCase().includes("nombre")) return false;
                  return true;
                });
                const duplicate = dataRows.some((r) => {
                  const nombre = r[1] ?? "";
                  const patologia = r[2] ?? "";
                  if (!nombre || !patologia) return false;
                  return dedupKey(nombre, patologia) === targetKey;
                });
                if (duplicate) {
                  return {
                    ok: true,
                    duplicate: true,
                    message:
                      "Lead ya existente en el CRM (mismo nombre y patología). No se guardó duplicado; continúa con el cierre normal.",
                  };
                }
              } catch (err) {
                console.warn("dedup check failed, continuing with append", err);
              }

              await appendLeadRow([
                ts,
                input.nombre,
                input.patologia,
                input.examen,
                input.prevision,
                input.region,
                input.horario,
                input.telefono,
                input.email,
                "landing-luna",
              ]);
              return { ok: true, message: "Lead guardado en CRM." };
            } catch (err) {
              console.error("appendLeadRow error", err);
              return {
                ok: false,
                message:
                  "No se pudo guardar en el CRM, pero los datos quedaron registrados para revisión manual.",
              };
            }
          },
        });

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
          tools: { save_lead: saveLead },
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});