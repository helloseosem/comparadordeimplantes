import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import sofiaAvatar from "@/assets/sofia-avatar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Comparador de Implantes Dentales en Valencia · Habla con Sofía" },
      { name: "description", content: "Encuentra la mejor oferta de implantes dentales en tu clínica más cercana de la provincia de Valencia. Habla con Sofía y recibe una valoración personalizada gratuita." },
      { property: "og:title", content: "Comparador de Implantes Dentales · Valencia" },
      { property: "og:description", content: "Implantes dentales en la provincia de Valencia. Habla con Sofía y coordina una llamada con un especialista." },
    ],
  }),
  component: Index,
});

function Index() {
  const WHATSAPP_NUMBER = "34600000000";

  const initialMessages: UIMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "¡Hola! 👋 Soy **Sofía**, asesora del Comparador de Implantes Dentales en **Valencia**. Cuéntame brevemente, ¿qué te ha llevado a interesarte por los implantes?",
        },
      ],
    },
  ];

  const transport = new DefaultChatTransport({ api: "/api/chat" });
  const { messages, sendMessage, status, error } = useChat({
    id: "sofia-chat",
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = status === "submitted" || status === "streaming";
  const leadSaved = messages.some((m) =>
    m.parts.some(
      (p) => p.type === "tool-save_lead" && (p as { state?: string }).state === "output-available",
    ),
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    void sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const whatsappFallback = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Sof%C3%ADa,%20me%20interesan%20los%20implantes%20dentales.`;

  const scrollToChat = () => {
    document.getElementById("sofia-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Brand band — navy header (replicates comparadorimplantes.es) */}
      <header className="relative z-10 bg-[var(--brand-navy)] text-[var(--brand-navy-foreground)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-7 text-center sm:py-9">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70">
              <span className="text-2xl">🦷</span>
            </div>
            <div className="leading-tight">
              <div className="text-xl font-light tracking-wide sm:text-2xl">Comparador</div>
              <div className="mt-1 inline-block rounded-full border border-white/80 px-3 py-0.5 text-[10px] font-bold tracking-[0.18em] sm:text-xs">
                IMPLANTES DENTALES
              </div>
            </div>
          </div>
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
          Habla con <span className="font-semibold text-foreground">Sofía</span>, nuestra asesora especializada. Valoramos tu caso y coordinamos una llamada con un especialista en una clínica colaboradora de la provincia de Valencia.
        </p>
        <button
          onClick={scrollToChat}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--cta)] px-5 py-2.5 text-sm font-medium text-[var(--cta-foreground)] shadow-lg shadow-[var(--cta)]/30 transition hover:brightness-110"
        >
          <span className="h-2 w-2 rounded-full bg-white/90 animate-pulse" />
          Habla con Sofía ahora →
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

      {/* Chat */}
      <section id="sofia-chat" className="relative z-10 mx-auto max-w-2xl px-6 pb-16">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card px-3 py-1 text-[11px] font-semibold tracking-wider text-primary shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> SOFÍA · ASESORA DENTAL · VALENCIA
          </span>
          <span className="text-xs text-muted-foreground">
            Cuéntale a <strong className="text-foreground">Sofía</strong> tu caso y coordinará tu valoración.
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={sofiaAvatar} alt="Sofía" width={44} height={44} className="h-11 w-11 rounded-full border-2 border-accent/60 object-cover" loading="lazy" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-[var(--online)]" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Sofía</div>
                <div className="text-[11px] text-muted-foreground">Asesora especializada · Implantes dentales</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--online)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--online)] animate-pulse" /> En línea ahora
            </span>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="max-h-[440px] min-h-[320px] space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((m) => {
              const text = m.parts
                .map((p) => (p.type === "text" ? p.text : ""))
                .join("")
                .trim();
              const savedHere = m.parts.some(
                (p) =>
                  p.type === "tool-save_lead" &&
                  (p as { state?: string }).state === "output-available",
              );
              if (!text && !savedHere) return null;
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[var(--bubble-user)] px-4 py-2.5 text-sm text-[var(--bubble-user-foreground)] shadow">
                      {text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex gap-2.5">
                  <img src={sofiaAvatar} alt="" width={32} height={32} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" loading="lazy" />
                  <div className="flex max-w-[80%] flex-col gap-2">
                    {text && (
                      <div className="rounded-2xl rounded-bl-sm bg-[var(--bubble-bot)] px-4 py-2.5 text-sm leading-relaxed text-foreground prose prose-sm max-w-none [&_p]:my-1">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    )}
                    {savedHere && (
                      <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--online)]/15 px-3 py-1 text-[11px] text-[var(--online)]">
                        <span>✓</span> Solicitud enviada al especialista
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2.5">
                <img src={sofiaAvatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
                <div className="rounded-2xl rounded-bl-sm bg-[var(--bubble-bot)] px-4 py-3 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </span>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                Ocurrió un error contactando a Sofía. Reintenta en unos segundos.
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={leadSaved ? "¡Listo! Puedes seguir conversando…" : "Escribe tu respuesta a Sofía…"}
              disabled={isLoading}
              autoComplete="off"
              maxLength={500}
              className="flex-1 rounded-full border border-border bg-input px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--cta)] text-[var(--cta-foreground)] shadow-lg shadow-[var(--cta)]/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Enviar"
            >
              ↑
            </button>
          </form>
        </div>

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
                text: "Dedica 1 minuto de tu tiempo a hablar con Sofía y contarnos tu caso.",
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 Comparador de Implantes Dentales · Valencia, España</span>
          <span>Este sitio no reemplaza una consulta odontológica.</span>
          <a href="#" className="underline-offset-2 hover:underline">Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
