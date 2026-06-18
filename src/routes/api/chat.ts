import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { appendLeadRow, createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

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

VALIDACIONES:
- Teléfono: número chileno de 8 a 11 dígitos, idealmente formato +569XXXXXXXX. Si no calza, pide confirmación amable.
- Email: debe tener @ y dominio. Si no, pide de nuevo.
- No avances al siguiente dato si el actual no es válido.

CIERRE:
- Cuando tengas TODOS los 8 datos válidos, llama a la herramienta save_lead UNA sola vez con los datos exactos.
- Después confirma a la persona: "Listo {nombre} ✅ Un coordinador humano te contactará al {telefono} dentro de las próximas horas para confirmar el horario exacto. También te enviaremos la confirmación a {email}."
- Ofrece un botón implícito: "Si quieres adelantar, escríbenos por WhatsApp."

No saludes de nuevo si ya saludaste. Empieza preguntando el nombre si no lo tienes.`;

const LeadSchema = z.object({
  nombre: z.string().min(2),
  patologia: z.string().min(2),
  examen: z.string().min(1),
  prevision: z.string().min(2),
  region: z.string().min(2),
  horario: z.string().min(2),
  telefono: z.string().min(8),
  email: z.string().email(),
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
            "Guarda el lead en el CRM (Google Sheets) una vez recolectados TODOS los datos validados.",
          inputSchema: LeadSchema,
          execute: async (input) => {
            const ts = new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" });
            try {
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
          messages: convertToModelMessages(messages),
          tools: { save_lead: saveLead },
          stopWhen: stepCountIs(50),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});