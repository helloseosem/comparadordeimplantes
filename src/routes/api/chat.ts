import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import {
  addLeadKeyToCache,
  appendLeadRow,
  createLovableAiGatewayProvider,
  getLeadKeySet,
} from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Eres Sofía, asesora especializada en implantes dentales del Comparador de Implantes Dentales en la provincia de Valencia (España). Tu personalidad es cercana, amable, profesional y eficiente. Hablas de forma natural, como una asesora humana experimentada. Vas directa al objetivo sin ser brusca. Evitas repetir información y no haces interrogatorios.

ÁMBITO GEOGRÁFICO (importante):
- Solo trabajamos con clínicas colaboradoras en la PROVINCIA DE VALENCIA (España): Valencia capital, Torrent, Paterna, Gandía, Sagunto, Alzira, Xàtiva, Burjassot, Mislata, Manises, Cullera, Sueca, Llíria, Quart de Poblet, Catarroja, Aldaia, Alaquàs, Carcaixent, Ontinyent, Algemesí, etc.
- Si la persona indica que vive FUERA de la provincia de Valencia, agradécele amablemente, dile que de momento solo damos servicio en la provincia de Valencia y no continúes recolectando datos ni llames a save_lead.
- Si dice una localidad de Valencia, confírmalo brevemente y continúa.

TU MISIÓN:
- Calificar al posible paciente e identificar sus necesidades.
- Generar confianza y agendar una llamada con un especialista.
- Si preguntan por precios: NUNCA inventes ni des cifras concretas. Redirige a una consulta con el especialista.

ESTILO:
- Español de España. Cercano, profesional, empático. Frases cortas y naturales.
- UNA sola pregunta por mensaje siempre que sea posible.
- Conecta cada pregunta con el contexto de lo que el usuario acaba de decir.
- No hagas todas las preguntas seguidas (nada de interrogatorios).
- Sin tecnicismos innecesarios. Emojis con mucha moderación (🦷 ✨).
- Nunca des diagnósticos clínicos: dilo y remite al especialista.

DATOS A RECOPILAR (de forma conversacional, no en orden rígido):
1. edad — una de: "Menor de 40", "41-50", "51-60", "61-70", "Mayor de 70".
2. dentadura_postiza — "Sí" o "No".
3. num_implantes — "1", "2-3", "4-5", "Más de 6", "No lo sabe".
4. presupuesto — "Hasta 800€", "Hasta 1.500€", "Hasta 2.000€", "Más de 2.000€", "No definido".
5. localidad — localidad o municipio dentro de la provincia de Valencia (pregunta de forma natural: "¿En qué localidad de Valencia te vendría bien la clínica?").
6. nombre (nombre y apellido).
7. telefono (móvil español, +34 6XXXXXXXX o 7XXXXXXXX — 9 dígitos empezando por 6 o 7).
8. email (correo válido).

MANEJO DE PRECIOS (importante):
Si preguntan precio responde algo como: "El coste varía bastante según el número de implantes, el estado del hueso y el tratamiento recomendado. Para darte una valoración precisa lo mejor es que uno de nuestros especialistas revise tu caso." Acto seguido pide su contacto para coordinar la llamada.

OBJECIONES:
Si dudan, habla de calidad de vida, comodidad, recuperación funcional y estética. Nunca presiones.

SEÑALES DE ALTA INTENCIÓN (dolor, pérdida reciente, prótesis incómoda, urgencia, interés en financiación, pedir presupuesto): prioriza cerrar la cita pidiendo nombre, teléfono y email.

VALIDACIONES (obligatorias antes de guardar):
- Teléfono: móvil español, normaliza a +34XXXXXXXXX (9 dígitos empezando por 6 o 7). Acepta "612 345 678", "+34612345678", "0034612345678". Si falla: "¿Me confirmas tu móvil? Debe ser un número español de 9 dígitos que empieza por 6 o 7, ej: +34 612 345 678 📱". Reintenta hasta 3 veces.
- Email: formato usuario@dominio.tld. Si falla: "Ese correo no parece válido 🙏 ¿me lo reenvías? ej: nombre@gmail.com".
- Si save_lead retorna validation_error, NO inventes datos: pide SOLO el campo fallido con ejemplo claro y reintenta.

CIERRE:
- Cuando tengas los 8 datos válidos DEBES invocar la herramienta "save_lead" con los datos exactos. NUNCA escribas el nombre de la herramienta ni sus argumentos en el chat.
- Después de que la herramienta retorne, envía: "Perfecto {nombre} ✅ Voy a coordinar una llamada con uno de nuestros especialistas en {localidad} para que pueda orientarte y darte una valoración personalizada. Te contactaremos al {telefono} en las próximas horas."

REGLA CRÍTICA: si el usuario te entrega varios datos en un mismo mensaje, NO los repitas en texto: invoca directamente save_lead con todos los campos disponibles (y pide solo los que falten).

No saludes de nuevo si ya saludaste.`;

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

const normalizeField = (raw: string) => {
  const cleaned = stripDiacritics(raw)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z0-9\s\-/€().,+]/g, "")
    .replace(/\s+/g, " ");
  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

const dedupKey = (nombre: string, telefono: string) =>
  `${normalizeName(nombre).toLowerCase()}|${telefono.replace(/\D/g, "")}`;

const LeadSchema = z.object({
  nombre: z.string().trim().transform(normalizeName).refine((v) => v.length >= 2, { message: "Nombre demasiado corto" }),
  edad: z.string().trim().transform(normalizeField).refine((v) => v.length >= 1, { message: "Edad requerida" }),
  dentadura_postiza: z.string().trim().transform(normalizeField).refine((v) => /^(Si|Sí|No)$/i.test(v), { message: "Indica Sí o No para dentadura postiza" }),
  num_implantes: z.string().trim().transform(normalizeField).refine((v) => v.length >= 1, { message: "Número de implantes requerido" }),
  presupuesto: z.string().trim().transform(normalizeField).refine((v) => v.length >= 2, { message: "Presupuesto requerido" }),
  localidad: z.string().trim().transform(normalizeName).refine((v) => v.length >= 2, { message: "Localidad de Valencia requerida" }),
  telefono: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => PHONE_RE.test(v), {
      message:
        "Teléfono inválido. Debe ser móvil español formato +34XXXXXXXXX (9 dígitos empezando por 6 o 7).",
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
            edad: z.string(),
            dentadura_postiza: z.string(),
            num_implantes: z.string(),
            presupuesto: z.string(),
            localidad: z.string(),
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
            const ts = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
            try {
              // Deduplicación: evita guardar el mismo lead (mismo nombre+telefono)
              const targetKey = dedupKey(input.nombre, input.telefono);
              try {
                const existing = await getLeadKeySet(dedupKey);
                if (existing.has(targetKey)) {
                  return {
                    ok: true,
                    duplicate: true,
                    message:
                      "Lead ya existente en el CRM (mismo nombre y teléfono). No se guardó duplicado; continúa con el cierre normal.",
                  };
                }
              } catch (err) {
                console.warn("dedup check failed, continuing with append", err);
              }

              await appendLeadRow([
                ts,
                input.nombre,
                input.edad,
                input.dentadura_postiza,
                input.num_implantes,
                input.presupuesto,
                input.localidad,
                input.telefono,
                input.email,
                "landing-sofia-valencia",
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