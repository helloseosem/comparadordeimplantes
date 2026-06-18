import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  addLeadKeyToCache,
  appendLeadRow,
  getLeadKeySet,
} from "@/lib/ai-gateway.server";

const PHONE_RE = /^\+34[67]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("0034")) local = local.slice(4);
  else if (local.startsWith("34") && local.length === 11) local = local.slice(2);
  if (local.length === 9 && /^[67]/.test(local)) return `+34${local}`;
  return raw.trim();
};

const normalizeName = (raw: string) =>
  stripDiacritics(raw)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");

const LeadSchema = z.object({
  edad: z.string().trim().min(1),
  dentadura_postiza: z.string().trim().min(1),
  num_implantes: z.string().trim().min(1),
  presupuesto: z.string().trim().min(1),
  localidad: z.string().trim().min(2).transform(normalizeName),
  nombre: z.string().trim().min(2).transform(normalizeName),
  telefono: z.string().trim().transform(normalizePhone).refine((v) => PHONE_RE.test(v), {
    message: "Teléfono inválido. Debe ser móvil español (+34 6XXXXXXXX o 7XXXXXXXX).",
  }),
  email: z.string().trim().toLowerCase().refine((v) => EMAIL_RE.test(v), {
    message: "Email inválido.",
  }),
  cita: z.string().trim().min(1),
});

const dedupKey = (nombre: string, telefono: string) =>
  `${normalizeName(nombre).toLowerCase()}|${telefono.replace(/\D/g, "")}`;

export const Route = createFileRoute("/api/lead")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ ok: false, message: "JSON inválido" }, { status: 400 });
        }

        const parsed = LeadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json(
            {
              ok: false,
              issues: parsed.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
              })),
            },
            { status: 422 },
          );
        }

        const input = parsed.data;
        const ts = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });

        try {
          const targetKey = dedupKey(input.nombre, input.telefono);
          try {
            const existing = await getLeadKeySet(dedupKey);
            if (existing.has(targetKey)) {
              return Response.json({ ok: true, duplicate: true });
            }
          } catch (err) {
            console.warn("dedup check failed, continuing", err);
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
            input.cita,
            "landing-form-valencia",
          ]);
          addLeadKeyToCache(targetKey);
          return Response.json({ ok: true });
        } catch (err) {
          console.error("appendLeadRow error", err);
          return Response.json(
            { ok: false, message: "No se pudo guardar el lead." },
            { status: 500 },
          );
        }
      },
    },
  },
});