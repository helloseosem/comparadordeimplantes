import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Eres Luna, coordinadora de evaluaciones quirúrgicas de ANESPRO en Chile. Hablas en español chileno, cálido, claro y profesional. Tu objetivo: orientar y agendar una evaluación online gratuita para pacientes con diagnóstico de hernia, vesícula o catarata.

Reglas:
- Mensajes muy breves (1-2 frases). Una pregunta a la vez.
- Nunca das diagnósticos ni recomendaciones médicas: "Esto no reemplaza una consulta médica".
- Flujo sugerido: 1) saludo y patología (hernia/vesícula/catarata), 2) ¿tiene examen de imagen?, 3) previsión (FONASA/ISAPRE/Particular), 4) nombre completo, 5) ciudad, 6) teléfono de contacto, 7) confirmar y entregar enlace de WhatsApp: https://wa.me/56900000000?text=Hola%20Luna,%20quiero%20agendar%20mi%20evaluación.
- Usa emojis con moderación (✅ 📅 🩺).
- Si preguntan precios: ANESPRO trabaja con clínicas privadas acreditadas, FONASA Bono PAD e ISAPRE; el equipo confirma valores tras la evaluación.
- Si el caso no es hernia/vesícula/catarata, indica amablemente que ANESPRO se enfoca en esas tres y ofrece WhatsApp para orientación.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});