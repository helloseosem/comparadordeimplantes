import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import heroBg from "@/assets/hero-bg.jpg";
import lunaAvatar from "@/assets/luna-avatar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ANESPRO · Coordinación quirúrgica · Hernia, Vesícula, Catarata" },
      { name: "description", content: "Equipo clínico que te acompaña en tu cirugía de hernia, vesícula o catarata. FONASA Bono PAD e ISAPRE. Agenda tu evaluación online con Luna." },
      { property: "og:title", content: "ANESPRO · Habla con Luna" },
      { property: "og:description", content: "Coordinación quirúrgica en clínicas privadas acreditadas. Evaluación online gratuita." },
    ],
  }),
  component: Index,
});

function Index() {
  const WHATSAPP_NUMBER = "56900000000";

  const initialMessages: UIMessage[] = [
    {
      id: "welcome",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: "Hola 👋 Soy **Luna** de ANESPRO. Te ayudo a coordinar tu evaluación quirúrgica online en menos de un minuto. ¿Cuál es tu nombre y apellido?",
        },
      ],
    },
  ];

  const transport = new DefaultChatTransport({ api: "/api/chat" });
  const { messages, sendMessage, status, error } = useChat({
    id: "luna-chat",
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

  const whatsappFallback = `https://wa.me/${WHATSAPP_NUMBER}?text=Hola%20Luna,%20quiero%20agendar%20mi%20evaluaci%C3%B3n.`;

  const scrollToChat = () => {
    document.getElementById("luna-chat")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" aria-hidden />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/40 bg-card/60 backdrop-blur">
            <span className="text-primary text-lg font-bold">A</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">ANESPRO</div>
            <div className="text-[11px] text-muted-foreground">Coordinación quirúrgica · Hernia · Vesícula · Catarata</div>
          </div>
        </div>
        <button
          onClick={scrollToChat}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--online)] animate-pulse" />
          Habla con Luna →
        </button>
      </header>

      {/* Hero */}
      <main className="relative z-10 mx-auto max-w-3xl px-6 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/40 px-4 py-1.5 text-[11px] font-semibold tracking-wider text-primary backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          HERNIA · VESÍCULA · CATARATA · FONASA · ISAPRE
        </div>
        <h1 className="mt-8 text-4xl font-bold leading-tight sm:text-5xl">
          ¿Tienes que operarte?
          <br />
          <span className="text-primary">Estamos aquí para acompañarte.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Con diagnóstico confirmado de hernia, vesícula o catarata, nuestro equipo clínico te acompaña en todo el proceso.{" "}
          <span className="font-semibold text-foreground">Clínicas privadas acreditadas.</span> FONASA Bono PAD e ISAPRE.
        </p>
        <button
          onClick={scrollToChat}
          className="mt-7 inline-flex items-center gap-2 rounded-full border border-[var(--online)]/40 bg-[var(--online)]/10 px-5 py-2 text-sm text-foreground backdrop-blur transition hover:bg-[var(--online)]/20"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--online)]" />
          Horarios disponibles — agenda tu evaluación online
        </button>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground sm:text-sm">
          {["Sin costo de evaluación inicial", "Videollamada online", "FONASA e ISAPRE", "Equipo médico certificado"].map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </main>

      {/* Chat */}
      <section id="luna-chat" className="relative z-10 mx-auto max-w-2xl px-6 pb-16">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-card/40 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> LUNA · ANESPRO
          </span>
          <span className="text-xs text-muted-foreground">
            Cuéntale a <strong className="text-foreground">Luna</strong> tu caso y ella coordinará tu evaluación.
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={lunaAvatar} alt="Luna" width={44} height={44} className="h-11 w-11 rounded-full border-2 border-primary/60 object-cover" loading="lazy" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-[var(--online)]" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">Luna</div>
                <div className="text-[11px] text-muted-foreground">Coordinadora de evaluaciones · ANESPRO</div>
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
                  <img src={lunaAvatar} alt="" width={32} height={32} className="h-8 w-8 flex-shrink-0 rounded-full object-cover" loading="lazy" />
                  <div className="flex max-w-[80%] flex-col gap-2">
                    {text && (
                      <div className="rounded-2xl rounded-bl-sm bg-[var(--bubble-bot)] px-4 py-2.5 text-sm leading-relaxed prose prose-sm prose-invert max-w-none [&_p]:my-1">
                        <ReactMarkdown>{text}</ReactMarkdown>
                      </div>
                    )}
                    {savedHere && (
                      <div className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--online)]/15 px-3 py-1 text-[11px] text-[var(--online)]">
                        <span>✓</span> Datos guardados en el CRM
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-2.5">
                <img src={lunaAvatar} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" loading="lazy" />
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
                Ocurrió un error contactando a Luna. Reintenta en unos segundos.
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
              placeholder={leadSaved ? "¡Listo! Puedes seguir conversando…" : "Escribe tu respuesta a Luna…"}
              disabled={isLoading}
              autoComplete="off"
              maxLength={500}
              className="flex-1 rounded-full border border-border bg-input/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/40 px-4 py-3 text-sm text-muted-foreground backdrop-blur transition hover:bg-card/70 hover:text-foreground"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--online)] text-[var(--bubble-user-foreground)] text-xs font-bold">W</span>
          ¿Prefieres escribir directamente? WhatsApp
        </a>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-background/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 ANESPRO · Coordinación quirúrgica Chile</span>
          <span>Este sitio no reemplaza una consulta médica.</span>
          <a href="#" className="underline-offset-2 hover:underline">Privacidad</a>
        </div>
      </footer>
    </div>
  );
}
