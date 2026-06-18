import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import sofiaAvatar from "@/assets/sofia-avatar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Implantes Dentales · Habla con Sofía y recibe tu valoración" },
      { name: "description", content: "Sofía, asesora especializada en implantes dentales, te ayuda a valorar tu caso y coordinar una llamada con un especialista. Consulta inicial gratuita." },
      { property: "og:title", content: "Implantes Dentales · Habla con Sofía" },
      { property: "og:description", content: "Asesoramiento personalizado en implantes dentales con Sofía. Coordina una llamada con uno de nuestros especialistas." },
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
          text: "¡Hola! 👋 Soy **Sofía**, asesora especializada en implantes dentales. Cuéntame brevemente, ¿qué te ha llevado a interesarte por los implantes?",
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
      {/* Background — soft hygienic gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% -100px, color-mix(in oklab, var(--accent) 25%, transparent), transparent 60%), linear-gradient(180deg, #ffffff 0%, #f1fbfb 100%)",
        }}
        aria-hidden
      />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-card shadow-sm">
            <span className="text-primary text-lg font-bold">🦷</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">IMPLANTES DENTALES</div>
            <div className="text-[11px] text-muted-foreground">Asesoramiento personalizado con Sofía</div>
          </div>
        </div>
        <button
          onClick={scrollToChat}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--cta)] px-4 py-2 text-sm font-medium text-[var(--cta-foreground)] shadow-lg shadow-[var(--cta)]/30 transition hover:brightness-110"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--online)] animate-pulse" />
          Habla con Sofía →
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card px-4 py-1.5 text-[11px] font-semibold tracking-wider text-primary shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          IMPLANTES · CARGA INMEDIATA · TODA ESPAÑA
        </div>
        <h1 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">
          ¿Necesitas implantes dentales?
          <br />
          <span className="text-accent">Recupera tu sonrisa con confianza.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Habla con <span className="font-semibold text-foreground">Sofía</span>, nuestra asesora especializada. Valoramos tu caso y coordinamos una llamada con uno de nuestros especialistas. Consulta inicial gratuita.
        </p>
        <button
          onClick={scrollToChat}
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--online)]/40 bg-[var(--online)]/10 px-5 py-2 text-sm text-foreground transition hover:bg-[var(--online)]/20"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--online)]" />
          Disponibilidad esta semana — habla con Sofía ahora
        </button>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          {["Consulta inicial gratuita", "Valoración personalizada", "Financiación disponible", "Especialistas acreditados"].map((f) => (
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
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> SOFÍA · ASESORA DENTAL
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 Comparador de Implantes Dentales · España</span>
          <span>Este sitio no reemplaza una consulta odontológica.</span>
          <a href="#" className="underline-offset-2 hover:underline">Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
