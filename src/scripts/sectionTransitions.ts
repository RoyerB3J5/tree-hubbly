import { gsap, ScrollTrigger } from "./gsap";
import { PIN_EDGE_INSET } from "./scrollSteps";

// Preview the next section on one gesture, enter it on the next one.
export function bindSectionTransitions(pairs: readonly (readonly [(HTMLElement | null | undefined), (HTMLElement | null | undefined)])[]) {
  const desktop = window.matchMedia("(min-width: 1280px) and (prefers-reduced-motion: no-preference)");
  let motion: gsap.core.Tween | undefined;
  let lastWheel = -Infinity;
  let consumedGesture = false;
  const root = document.documentElement;
  const finish = () => {
    root.classList.remove("section-transitioning");
  };
  const wheel = (event: WheelEvent) => {
    if (event.defaultPrevented || !desktop.matches || event.ctrlKey ||
        root.classList.contains("desktop-menu-open") ||
        document.getElementById("mobile-menu")?.classList.contains("translate-x-0") ||
        (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']"))) return;
    const now = performance.now();
    const sameGesture = now - lastWheel < 100;
    lastWheel = now;
    if (event.deltaY < 0) {
      motion?.kill();
      finish();
      consumedGesture = false;
      return;
    }
    if (event.deltaY === 0) return;
    if (motion?.isActive() || (sameGesture && consumedGesture)) {
      event.preventDefault();
      return;
    }
    consumedGesture = false;
    for (const [current, destination] of pairs) {
      if (!current || !destination) continue;
      const pins = ScrollTrigger.getAll();
      const currentPin = pins.find(pin => pin.trigger === current && pin.pin);
      // Take over at the same inset where the final scroll step stops.
      // Requiring a native wheel event to cross the pin end releases it abruptly.
      const edgeInset = currentPin ? Math.min(PIN_EDGE_INSET, (currentPin.end - currentPin.start) / 4) : 0;
      if (currentPin && window.scrollY < currentPin.end - edgeInset - 0.5) continue;
      const destinationPin = pins.find(pin => pin.trigger === destination && pin.pin);
      if (destinationPin?.isActive) continue;
      const top = destinationPin?.start ?? destination.getBoundingClientRect().top + window.scrollY;
      const distance = top - window.scrollY;
      if (distance <= 8 || distance > window.innerHeight + 8) continue;
      // A pinned section can still be finishing its last step; don't interpret
      // the tail of that gesture as a request to leave it. Ordinary sections
      // can transition as soon as the next section is within reach.
      if (currentPin && sameGesture) return;
      const visible = window.innerHeight - distance;
      const target = visible < window.innerHeight * 0.12
        ? top - window.innerHeight * 0.82
        : top + (destinationPin ? 2 : 0);
      event.preventDefault();
      consumedGesture = true;
      root.classList.add("section-transitioning");
      const position = { y: window.scrollY };
      motion = gsap.to(position, {
        y: target, duration: 0.85, ease: "power2.inOut",
        onUpdate: () => {
          window.scrollTo({ top: position.y, behavior: "instant" });
          ScrollTrigger.update();
        },
        onComplete: finish, onInterrupt: finish,
      });
      break;
    }
  };
  document.addEventListener("site-scroll-stop", () => {
    motion?.kill();
    finish();
    consumedGesture = false;
    lastWheel = -Infinity;
  });
  window.addEventListener("wheel", wheel, { passive: false, capture: true });
}
