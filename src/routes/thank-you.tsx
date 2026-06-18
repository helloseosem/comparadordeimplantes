import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "¡Gracias por contactarnos! · Comparador de Implantes" },
      { name: "description", content: "Hemos recibido tu solicitud. Un asesor te contactará en breve." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "conversion_formulario", {
        event_category: "leads",
        event_label: "formulario_contacto",
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <header className="bg-[var(--brand-navy)] py-6 text-center text-[var(--brand-navy-foreground)]">
        <Link to="/" className="text-sm font-semibold tracking-wider uppercase opacity-80 hover:opacity-100">
          Comparador de Implantes Dentales
        </Link>
      </header>

      <section className="mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center sm:py-28">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--online)]/15 text-4xl text-[var(--online)]">
          ✓
        </div>
        <h1 className="text-3xl font-bold leading-tight text-primary sm:text-4xl">
          ¡Gracias por contactarnos!
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          Hemos recibido tu solicitud correctamente. Un asesor especializado se pondrá en contacto
          contigo en las próximas horas para confirmar tu cita y resolver todas tus dudas.
        </p>

        <div className="mt-10 grid w-full gap-3 sm:grid-cols-3">
          {[
            { n: "1", t: "Te llamamos", d: "En el horario que elegiste." },
            { n: "2", t: "Valoración gratuita", d: "Sin compromiso ni coste." },
            { n: "3", t: "Comparas presupuestos", d: "Eliges la mejor opción." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-5 text-left">
              <div className="text-xs font-semibold tracking-[0.18em] text-accent">PASO {s.n}</div>
              <div className="mt-2 text-sm font-semibold text-primary">{s.t}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.d}</div>
            </div>
          ))}
        </div>

        <Link
          to="/"
          className="mt-12 inline-flex items-center gap-2 rounded-full bg-[var(--cta)] px-7 py-3.5 text-sm font-semibold text-[var(--cta-foreground)] shadow-lg shadow-[var(--cta)]/30 transition hover:brightness-110"
        >
          ← Volver al inicio
        </Link>
      </section>
    </main>
  );
}