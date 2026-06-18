import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import {
  addLeadKeyToCache,
  appendLeadRow,
  createLovableAiGatewayProvider,
  getLeadKeySet,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Eres Gelito, asesor virtual del Comparador de Implantes Dentales (España). Tu objetivo es ayudar a la persona a recibir un presupuesto personalizado de implantes dentales en su clínica más cercana, y recolectar sus datos de forma cálida, breve y profesional.

REGLAS DE CONVERSACIÓN:
- Responde SIEMPRE en español de España, con tono cercano, claro y empático.
- Mensajes cortos (máx 2 frases por turno). Una sola pregunta a la vez.
- Usa emojis con moderación (🦷 ✨ ✅). Nada de markdown pesado.
- Si la persona divaga, redirígela con amabilidad al objetivo.
- Nunca des diagnósticos. Si preguntan algo clínico, di que el equipo dental lo valorará en la consulta presencial gratuita.

DATOS QUE DEBES RECOLECTAR (en este orden lógico, adaptándote a lo que ya dijo):
1. nombre (nombre y apellido)
2. situacion (Falta 1 diente / Faltan varios / Boca completa / No lo sé aún)
3. radiografia (sí/no — si tiene radiografía panorámica o informe dental reciente)
4. seguro (Privado / Mutua / Sin seguro)
5. provincia (provincia o ciudad de España)
6. horario (Mañana / Tarde / Indiferente)
7. telefono (móvil español, +34 6XXXXXXXX o 7XXXXXXXX — 9 dígitos empezando por 6 o 7)
8. email (correo válido)

VALIDACIONES (OBLIGATORIAS — no avances si fallan):
- Teléfono: móvil español. Normalízalo a +34XXXXXXXXX (9 dígitos, empezando por 6 o 7). Acepta variantes como "612 345 678", "+34612345678", "0034612345678". Si no es válido, pide AMABLEMENTE que lo reenvíe: "¿Me confirmas tu móvil? Debe ser un número español de 9 dígitos que empieza por 6 o 7, ej: +34 612 345 678 📱". Reintenta hasta 3 veces.
- Email: formato usuario@dominio.tld válido. Si no, responde: "Ese correo no parece válido 🙏 ¿me lo reenvías? ej: nombre@gmail.com". Reintenta.
- Si save_lead retorna un error de validación, NO inventes datos: pide al usuario SOLO el campo que falló, con un ejemplo claro, y reintenta save_lead cuando lo tengas.
- Nunca llames save_lead si falta cualquiera de los 8 datos o si alguno no pasa validación.

CIERRE:
- Cuando tengas TODOS los 8 datos válidos, DEBES invocar la herramienta "save_lead" con los datos exactos. NUNCA escribas el nombre de la herramienta ni sus argumentos en el texto del chat.
- Solo DESPUÉS de que la herramienta retorne, envía un mensaje de confirmación: "¡Listo {nombre}! ✅ Una clínica colaboradora te contactará al {telefono} en las próximas horas para confirmar tu cita gratuita. También te enviaremos la información a {email}."

REGLA CRÍTICA: Si el usuario en un solo mensaje te entrega varios datos, NO los repitas en texto: invoca directamente save_lead con todos los campos.

No saludes de nuevo si ya saludaste. Empieza preguntando el nombre si no lo tienes.`;

const PHONE_RE = /^\+34[67]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  // strip leading 0034 / 34 if present
  let local = digits;
  if (local.startsWith("0034")) local = local.slice(4);
  else if (local.startsWith("34") && local.length === 11) local = local.slice(2);
  if (local.length === 9 && /^[67]/.test(local)) return `+34${local}`;
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
              const targetKey = dedupKey(input.nombre, input.patologia);
              try {
                const existing = await getLeadKeySet(dedupKey);
                if (existing.has(targetKey)) {
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
              addLeadKeyToCache(targetKey);
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