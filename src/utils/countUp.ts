/**
 * Utilidad compartida para animar números (count-up: 0 -> valor final).
 *
 * Contrato:
 * - El servidor (frontmatter de Astro) usa `parseCountUpValue()` para
 *   descomponer el string visible ("$750,000", "85%", "+18%", "$750K")
 *   en { prefix, target, decimals, suffix } sin duplicar lógica.
 * - El cliente usa `initCountUp()` una sola vez por página: observa todos
 *   los `[data-count-up]` con IntersectionObserver y anima con
 *   requestAnimationFrame + easing. Respeta `prefers-reduced-motion`.
 *
 * Uso en plantillas (vía `CountUp.astro`, no directamente):
 *   <span data-count-up data-target="750000" data-prefix="$" ...>$750,000</span>
 */

export interface CountUpParts {
  prefix: string;
  target: number;
  decimals: number;
  suffix: string;
}

/** "−$1,250.50M" -> { prefix: "−$", target: 1250.5, decimals: 1, suffix: "M" } */
export function parseCountUpValue(raw: string): CountUpParts {
  const match = raw.trim().match(/^([^0-9+\-.,]*)([+\-]?[\d,]*\.?\d+)(.*)$/);
  if (!match) return { prefix: "", target: 0, decimals: 0, suffix: raw };
  const [, prefix, numeric, suffix] = match;
  const decimals = numeric.includes(".")
    ? (numeric.split(".")[1]?.length ?? 0)
    : 0;
  const target = Number(numeric.replace(/,/g, "")) || 0;
  return { prefix, target, decimals, suffix };
}

/** Formatea con separadores de miles y decimales preservados. */
export function formatCountUpValue(
  value: number,
  decimals: number,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animateElement(el: HTMLElement): void {
  if (el.dataset.countupDone === "true") return;
  el.dataset.countupDone = "true";

  const target = Number(el.dataset.target || 0);
  const decimals = Number(el.dataset.decimals || 0);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const duration = Math.max(Number(el.dataset.duration || 1200), 0);
  const delay = Math.max(Number(el.dataset.delay || 0), 0);
  const finalText = el.dataset.final || el.textContent || "";

  const render = (current: number) => {
    el.textContent = `${prefix}${formatCountUpValue(current, decimals)}${suffix}`;
  };

  // Frame final exacto desde las partes (prefijo/número/sufijo), no desde el
  // snapshot de textContent: así el sufijo ("%","K","$280,000"->"") nunca se
  // pierde aunque el HTML inicial viniera incompleto. Solo si el valor no era
  // numérico (parse fallido: target 0 con todo el texto en `suffix`) se
  // restaura el texto original.
  const renderFinal = () => {
    if (target === 0 && prefix === "" && suffix === finalText) {
      el.textContent = finalText;
    } else {
      render(target);
    }
  };

  // Sin animación: movimiento reducido, sin IO o duración 0 -> valor final.
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    duration === 0
  ) {
    renderFinal();
    return;
  }

  // Estado inicial 0 (mejora progresiva: el HTML trae el valor final por SEO/no-JS).
  render(0);
  const startAt = performance.now() + delay;

  const tick = (now: number) => {
    if (now < startAt) {
      requestAnimationFrame(tick);
      return;
    }
    const progress = Math.min((now - startAt) / duration, 1);
    render(target * easeOutCubic(progress));
    if (progress < 1) requestAnimationFrame(tick);
    else renderFinal(); // valor exacto, evita redondeos ("749,999" vs "750,000")
  };
  requestAnimationFrame(tick);
}

/**
 * Idempotente: cada llamada solo inicializa los `[data-count-up]` aún no
 * vistos, así que puede invocarse desde varios componentes sin duplicar
 * observers ni animaciones.
 */
export function initCountUp(
  root: ParentNode = document,
  threshold = 0.3,
): void {
  const els = Array.from(
    root.querySelectorAll<HTMLElement>("[data-count-up]:not([data-countup-init])"),
  );
  if (els.length === 0) return;

  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => {
      el.dataset.countupInit = "true";
      animateElement(el);
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateElement(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold },
  );

  for (const el of els) {
    el.dataset.countupInit = "true";
    // Guarda el texto final renderizado por el servidor antes de tocarlo.
    if (!el.dataset.final) el.dataset.final = el.textContent || "";
    observer.observe(el);
  }
}
