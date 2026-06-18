import { useEffect, useMemo, useRef, useState } from "react";

type StepKey =
  | "edad"
  | "dentadura_postiza"
  | "num_implantes"
  | "presupuesto"
  | "localidad"
  | "nombre"
  | "telefono"
  | "email"
  | "cita";

type ChoiceStep = {
  key: StepKey;
  kind: "choice";
  question: string;
  hint?: string;
  options: string[];
};
type TextStep = {
  key: StepKey;
  kind: "text";
  question: string;
  hint?: string;
  placeholder: string;
  inputType?: "text" | "email" | "tel";
  validate?: (v: string) => string | null;
};
type CitaStep = {
  key: "cita";
  kind: "cita";
  question: string;
  hint?: string;
};
type Step = ChoiceStep | TextStep | CitaStep;

const PHONE_RE = /^\+?\d[\d\s()-]{7,}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const STEPS: Step[] = [
  {
    key: "edad",
    kind: "choice",
    question: "¿En qué rango de edad te encuentras?",
    hint: "Esto nos ayuda a recomendarte el especialista adecuado.",
    options: ["Menor de 40", "41-50", "51-60", "61-70", "Mayor de 70"],
  },
  {
    key: "dentadura_postiza",
    kind: "choice",
    question: "¿Llevas actualmente dentadura postiza?",
    options: ["Sí", "No"],
  },
  {
    key: "num_implantes",
    kind: "choice",
    question: "¿Cuántos implantes crees que necesitas?",
    hint: "Una estimación está bien. El especialista lo confirmará.",
    options: ["1", "2-3", "4-5", "Más de 6", "No lo sé"],
  },
  {
    key: "presupuesto",
    kind: "choice",
    question: "¿Qué presupuesto tienes en mente?",
    hint: "Hay opciones de financiación en todos los rangos.",
    options: ["Hasta 800€", "Hasta 1.500€", "Hasta 2.000€", "Más de 2.000€", "No definido"],
  },
  {
    key: "localidad",
    kind: "text",
    question: "¿En qué localidad de Valencia te vendría mejor?",
    hint: "Buscaremos la clínica colaboradora más cercana.",
    placeholder: "Ej: Valencia, Torrent, Gandía…",
    validate: (v) => (v.trim().length >= 2 ? null : "Indica una localidad"),
  },
  {
    key: "nombre",
    kind: "text",
    question: "¿Cómo te llamas?",
    hint: "Nombre y apellido.",
    placeholder: "Ej: María García",
    validate: (v) => (v.trim().length >= 2 ? null : "Escribe tu nombre"),
  },
  {
    key: "telefono",
    kind: "text",
    question: "¿A qué móvil te llamamos?",
    hint: "Móvil español, de 9 dígitos empezando por 6 o 7.",
    placeholder: "+34 612 345 678",
    inputType: "tel",
    validate: (v) => (PHONE_RE.test(v.trim()) ? null : "Número no válido"),
  },
  {
    key: "email",
    kind: "text",
    question: "Por último, ¿tu email?",
    hint: "Te enviaremos la confirmación de la valoración.",
    placeholder: "nombre@gmail.com",
    inputType: "email",
    validate: (v) => (EMAIL_RE.test(v.trim()) ? null : "Email no válido"),
  },
  {
    key: "cita",
    kind: "cita",
    question: "¿Cuándo prefieres que te llamemos?",
    hint: "Elige un día y una franja horaria.",
  },
];

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const SLOT_TIMES = ["10:00", "11:30", "13:00", "16:00", "17:30", "19:00"];

function buildNextDays(count: number) {
  const out: { iso: string; label: string; weekday: string; day: number; month: string }[] = [];
  const d = new Date();
  let added = 0;
  while (added < count) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd === 0) continue; // skip Sunday
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: `${DAY_LABELS[wd]} ${d.getDate()} ${MONTHS[d.getMonth()]}`,
      weekday: DAY_LABELS[wd],
      day: d.getDate(),
      month: MONTHS[d.getMonth()],
    });
    added++;
  }
  return out;
}

export default function LeadForm() {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textValue, setTextValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const step = STEPS[stepIndex];
  const days = useMemo(() => buildNextDays(3), []);
  const [citaDay, setCitaDay] = useState<string | null>(null);

  const progress = ((stepIndex + (submitted ? 1 : 0)) / STEPS.length) * 100;

  useEffect(() => {
    setTextValue("");
    setError(null);
    setCitaDay(null);
    if (step?.kind === "text") {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [stepIndex, step?.kind]);

  const advance = (key: StepKey, value: string) => {
    setLeaving(true);
    setTimeout(() => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
      if (stepIndex + 1 >= STEPS.length) {
        void submit({ ...answers, [key]: value });
      } else {
        setStepIndex((i) => i + 1);
      }
      setLeaving(false);
    }, 280);
  };

  const submit = async (data: Record<string, string>) => {
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { issues?: { field: string; message: string }[] } | null;
        setServerError(j?.issues?.[0]?.message ?? "No pudimos enviar tu solicitud. Reintenta en unos segundos.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Error de conexión. Revisa tu internet y reintenta.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step.kind !== "text") return;
    const v = textValue.trim();
    const err = step.validate?.(v) ?? null;
    if (err) {
      setError(err);
      return;
    }
    advance(step.key, v);
  };

  const handleCitaPick = (day: string, time: string) => {
    const found = days.find((d) => d.iso === day);
    const label = found ? `${found.label} · ${time}` : `${day} ${time}`;
    advance("cita", label);
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-2xl shadow-primary/10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--online)]/15 text-2xl text-[var(--online)]">
          ✓
        </div>
        <h3 className="text-2xl font-bold text-primary">¡Solicitud enviada!</h3>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Gracias <strong className="text-foreground">{answers.nombre}</strong>. Un asesor te llamará al{" "}
          <strong className="text-foreground">{answers.telefono}</strong> para tu cita del{" "}
          <strong className="text-foreground">{answers.cita}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-10">
      {/* progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-[var(--cta)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground">
          {stepIndex + 1} / {STEPS.length}
        </span>
      </div>

      <div className="relative min-h-[320px]">
        <div
          key={step.key}
          className={`transition-all duration-300 ease-out ${
            leaving ? "opacity-0 -translate-y-3 scale-[0.98]" : "opacity-100 translate-y-0 scale-100"
          }`}
        >
          <div className="mb-1 text-[11px] font-semibold tracking-[0.18em] text-accent">
            PASO {stepIndex + 1}
          </div>
          <h3 className="text-2xl font-bold leading-tight text-primary sm:text-3xl">
            {step.question}
          </h3>
          {step.hint && (
            <p className="mt-2 text-sm text-muted-foreground">{step.hint}</p>
          )}

          <div className="mt-7">
            {step.kind === "choice" && (
              <div className="grid gap-2.5 sm:grid-cols-2">
                {step.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => advance(step.key, opt)}
                    className="group flex items-center justify-between rounded-2xl border-2 border-border bg-background px-5 py-4 text-left text-sm font-medium text-foreground transition hover:border-accent hover:bg-secondary sm:text-base"
                  >
                    <span>{opt}</span>
                    <span className="text-accent opacity-0 transition group-hover:opacity-100">→</span>
                  </button>
                ))}
              </div>
            )}

            {step.kind === "text" && (
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <input
                  ref={inputRef}
                  type={step.inputType ?? "text"}
                  value={textValue}
                  onChange={(e) => {
                    setTextValue(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={step.placeholder}
                  autoComplete="off"
                  className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--cta)] px-6 py-3 text-sm font-semibold text-[var(--cta-foreground)] shadow-lg shadow-[var(--cta)]/30 transition hover:brightness-110"
                >
                  Continuar →
                </button>
              </form>
            )}

            {step.kind === "cita" && (
              <div className="space-y-5">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {days.map((d) => {
                    const active = citaDay === d.iso;
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        onClick={() => setCitaDay(d.iso)}
                        className={`rounded-2xl border-2 px-4 py-3 text-center transition ${
                          active
                            ? "border-accent bg-accent/10"
                            : "border-border bg-background hover:border-accent/60"
                        }`}
                      >
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {d.weekday}
                        </div>
                        <div className="mt-0.5 text-2xl font-bold text-primary">{d.day}</div>
                        <div className="text-[11px] text-muted-foreground">{d.month}</div>
                      </button>
                    );
                  })}
                </div>
                {citaDay && (
                  <div className="animate-in fade-in duration-300">
                    <div className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground">
                      HORARIOS DISPONIBLES
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {SLOT_TIMES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={submitting}
                          onClick={() => handleCitaPick(citaDay, t)}
                          className="rounded-xl border-2 border-border bg-background px-2 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent hover:bg-secondary disabled:opacity-50"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {submitting && (
                  <p className="text-center text-sm text-muted-foreground">Enviando tu solicitud…</p>
                )}
                {serverError && (
                  <p className="text-center text-sm text-destructive">{serverError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}