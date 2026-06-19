import { createFileRoute } from "@tanstack/react-router";
import LeadForm from "@/components/LeadForm";
import TestimonialsSection from "@/components/TestimonialsSection";
import LogoHeader from "@/components/LogoHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comparador de Implantes Dentales en Valencia · Valoración Gratuita" },
      { name: "description", content: "Encuentra la mejor oferta de implantes dentales en tu clínica más cercana de la provincia de Valencia. Recibe una valoración personalizada gratuita." },
      { property: "og:title", content: "Comparador de Implantes Dentales · Valencia" },
      { property: "og:description", content: "Implantes dentales en la provincia de Valencia. Coordina una llamada con un especialista y compara presupuestos." },
    ],
  }),
  component: Index,
});

function Index() {
  const WHATSAPP_NUMBER = "34600000000";
  const whatsappFallback = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20me%20interesan%20los%20implantes%20dentales%20en%20Valencia.`;

  const scrollToForm = () => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Brand band — navy header (replicates comparadorimplantes.es) */}
      <header className="relative z-10 bg-[var(--brand-navy)] text-[var(--brand-navy-foreground)]">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 py-6 sm:py-8">
          <a href="/" aria-label="Comparador de Implantes Dentales" className="inline-block">
            <LogoHeader className="h-16 w-auto sm:h-20" />
          </a>
        </div>
      </header>

      {/* H1 band — soft mint */}
      <section className="relative z-10 bg-[var(--section-mint)]">
        <div className="mx-auto max-w-4xl px-6 py-10 text-center sm:py-14">
          <h1 className="text-3xl font-bold text-primary sm:text-5xl">
            Comparador de Implantes Dentales
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary/85 sm:text-xl">
            Encuentra la mejor oferta para Implantes Dentales en tu Clínica más Cercana{" "}
            <strong>en la provincia de Valencia</strong>
          </p>
        </div>
      </section>

      {/* Hero sub + CTA */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-10 pb-2 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card px-4 py-1.5 text-[11px] font-semibold tracking-wider text-primary shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          VALENCIA · CONSULTA GRATUITA · FINANCIACIÓN
        </div>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Valoramos tu caso y coordinamos una llamada con un especialista en una clínica colaboradora de la provincia de Valencia.
        </p>
        <button
          onClick={scrollToForm}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--cta)] px-5 py-2.5 text-sm font-medium text-[var(--cta-foreground)] shadow-lg shadow-[var(--cta)]/30 transition hover:brightness-110"
        >
          <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse" />
          Solicita tu valoración →
        </button>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          {["Consulta inicial gratuita", "Valoración personalizada", "Financiación disponible", "Clínicas en Valencia"].map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="text-accent">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </main>

      {/* Formulario inmersivo */}
      <section id="lead-form" className="relative z-10 mx-auto max-w-2xl px-6 pb-16">
        <LeadForm />

        <a
          href={whatsappFallback}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--online)] text-[var(--bubble-user-foreground)] text-xs font-bold">W</span>
          ¿Prefieres escribir directamente? WhatsApp
        </a>
      </section>

      {/* 3 simples pasos */}
      <section className="relative z-10 bg-[var(--section-mint)]">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="text-lg text-primary/80 sm:text-2xl">
            Consigue los mejores precios para implantes dentales en
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-primary sm:text-5xl">
            3 simples pasos
          </h2>

          <div className="mt-12 grid gap-10 sm:grid-cols-3 sm:divide-x sm:divide-accent/40">
            {[
              {
                icon: (
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary">
                    <span className="text-2xl font-bold text-primary">1'</span>
                  </div>
                ),
                text: "Dedica 1 minuto de tu tiempo a rellenar el formulario y contarnos tu caso.",
              },
              {
                icon: (
                  <div className="flex h-20 w-20 items-center justify-center text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-14 w-14">
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />
                      <circle cx="9" cy="12" r="1" fill="currentColor" />
                      <circle cx="13" cy="12" r="1" fill="currentColor" />
                      <circle cx="17" cy="12" r="1" fill="currentColor" />
                    </svg>
                  </div>
                ),
                text: "Un asesor personal te contactará para informarte de las diferentes ofertas y clínicas que hay para tu caso en Valencia.",
              },
              {
                icon: (
                  <div className="flex h-20 w-20 items-center justify-center text-primary">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-14 w-14">
                      <rect x="5" y="3" width="14" height="18" rx="2" />
                      <path d="M12 8c-1.2 0-2 .8-2 2 0 1.4 2 4 2 4s2-2.6 2-4c0-1.2-.8-2-2-2Z" />
                      <path d="M8 17h8" />
                    </svg>
                  </div>
                ),
                text: "Valora tu presupuesto y realiza tu tratamiento dental con la mejor tecnología y los odontólogos más cualificados de Valencia.",
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-5 px-4">
                {step.icon}
                <p className="max-w-xs text-sm leading-relaxed text-primary/80 sm:text-base">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clínicas especialistas — sección oscura */}
      <section className="relative z-10 bg-[#1f2326] py-20 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-2xl font-light leading-snug sm:text-4xl">
            Trabajamos con{" "}
            <span className="font-semibold underline decoration-2 underline-offset-[6px]">
              clínicas especialistas
            </span>
          </p>
          <p className="mt-3 text-lg font-light text-white/80 sm:text-2xl">
            en implantología dental que te ofrecen:
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                bg: "bg-[var(--brand-navy)]",
                fg: "text-white",
                text: "Profesionales altamente cualificados en implantología",
              },
              {
                bg: "bg-[var(--accent)]",
                fg: "text-[var(--brand-navy)]",
                text: "Especializados en casos difíciles y derivaciones",
              },
              {
                bg: "bg-white",
                fg: "text-[var(--brand-navy)]",
                text: "Clínicas Premium a precio justo",
              },
              {
                bg: "bg-[var(--section-mint)]",
                fg: "text-[var(--brand-navy)]",
                text: "Tecnología e instalaciones con los mayores avances del sector",
              },
            ].map((c, i) => (
              <div
                key={i}
                className={`flex min-h-[140px] items-center justify-center rounded-2xl px-6 py-7 text-center text-base font-semibold leading-snug shadow-lg sm:text-lg ${c.bg} ${c.fg}`}
              >
                {c.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <TestimonialsSection />

      {/* Footer — replicates comparadorimplantes.es */}
      <footer className="relative z-10 bg-white text-[var(--brand-navy)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-8 lg:flex-row">
          <div className="flex items-center gap-2 text-sm sm:text-base">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[var(--accent)]" aria-hidden="true">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
            </svg>
            <span>Pasaje Ventura Feliu, 21, 2A. 46007 Valencia.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:info@comparadorimplantes.es" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              info@comparadorimplantes.es
            </a>
            <a href="tel:+34963412467" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z" />
              </svg>
              963 41 24 67
            </a>
            <a href="tel:+34611020278" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:brightness-110">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              611 02 02 78
            </a>
          </div>
        </div>
        <div className="bg-[#ebeceb]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-4 text-xs text-[var(--brand-navy)] sm:text-sm lg:flex-row">
            <p>
              © 2018 - 2026 | <strong>Comparador de Implantes Online</strong>. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {["Aviso Legal", "Política de Cookies", "Política de Privacidad"].map((item) => (
                <a key={item} href="#" className="inline-flex items-center gap-1.5 hover:underline">
                  <span className="text-[var(--accent)]">✓</span>
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
