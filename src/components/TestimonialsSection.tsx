import { useState, useCallback } from "react";
import testimonialImage from "@/assets/testimonial-patient.jpg";

const testimonials = [
  {
    quote:
      "Gracias al Comparador pude obtener los mejores precios. Después de buscar por diferentes clínicas de Valencia, me consiguieron una oferta que no encontré por mi cuenta. Estoy haciéndome el tratamiento de implantes dentales en Valencia y, de momento, todo muy bien.",
    name: "Luis Pérez",
    role: "Usuario Comparador",
  },
  {
    quote:
      "Llevaba años con miedo al dentista y una dentadura postiza que no me permitía comer con tranquilidad. Desde que rellené el formulario, todo fue muy sencillo. Me citaron con un especialista en Valencia en menos de 48 horas y el presupuesto me salió mucho mejor de lo que esperaba.",
    name: "María Gómez",
    role: "Paciente en Valencia",
  },
  {
    quote:
      "Me ofrecieron financiación sin intereses y eso fue clave para mí. No podía pagar todo el tratamiento de golpe y, gracias al Comparador, pude hacerme los implantes que necesitaba sin preocuparme. El trato del asesor fue impecable desde el primer minuto.",
    name: "Carlos Martínez",
    role: "Usuario Comparador",
  },
  {
    quote:
      "Tenía una situación complicada, con poco hueso y me habían dicho que sería muy caro en cualquier sitio. El Comparador me derivó a una clínica especializada en casos difíciles aquí en Valencia y el resultado ha sido excelente. Son verdaderamente profesionales.",
    name: "Ana Ruiz",
    role: "Paciente en Valencia",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback(
    (index: number, dir: "left" | "right") => {
      if (isAnimating || index === active) return;
      setDirection(dir);
      setIsAnimating(true);
      setTimeout(() => {
        setActive(index);
        setTimeout(() => setIsAnimating(false), 50);
      }, 300);
    },
    [active, isAnimating]
  );

  const prev = useCallback(() => {
    const nextIndex = active === 0 ? testimonials.length - 1 : active - 1;
    goTo(nextIndex, "left");
  }, [active, goTo]);

  const next = useCallback(() => {
    const nextIndex = active === testimonials.length - 1 ? 0 : active + 1;
    goTo(nextIndex, "right");
  }, [active, goTo]);

  const current = testimonials[active];

  return (
    <section className="relative z-10 bg-white">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-stretch lg:grid-cols-2">
          {/* Left image */}
          <div className="relative h-64 overflow-hidden sm:h-80 lg:h-auto">
            <img
              src={testimonialImage}
              alt="Paciente satisfecho sonriendo después de su tratamiento de implantes dentales en Valencia"
              className="h-full w-full object-cover"
              loading="lazy"
              width={1024}
              height={1024}
            />
          </div>

          {/* Right content */}
          <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:py-16">
            <h2 className="text-4xl font-bold text-[var(--brand-navy)] sm:text-5xl">
              Testimonios
            </h2>
            <p className="mt-1 text-xl text-[var(--accent)] sm:text-2xl">
              de usuarios del comparador
            </p>

            <div className="relative mt-8 min-h-[180px] overflow-hidden">
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  opacity: isAnimating ? 0 : 1,
                  transform: isAnimating
                    ? direction === "right"
                      ? "translateX(-20px)"
                      : "translateX(20px)"
                    : "translateX(0)",
                }}
              >
                <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {current.quote}
                </p>
                <div className="mt-6 text-center">
                  <p className="text-lg font-semibold text-[var(--brand-navy)]">
                    {current.name}
                  </p>
                  <p className="text-sm text-[var(--accent)]">{current.role}</p>
                </div>
              </div>
            </div>

            {/* Arrows + dots */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={prev}
                aria-label="Testimonio anterior"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i, i > active ? "right" : "left")}
                    aria-label={`Ir al testimonio ${i + 1}`}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      i === active
                        ? "bg-[var(--brand-navy)]"
                        : "bg-[var(--brand-navy)]/30 hover:bg-[var(--brand-navy)]/50"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                aria-label="Siguiente testimonio"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--accent)] text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
