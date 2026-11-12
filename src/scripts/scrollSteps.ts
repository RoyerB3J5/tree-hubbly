import { gsap, ScrollTrigger } from "./gsap";

// One gesture advances to one complete state at a fixed animation speed.
export function bindScrollSteps(timeline: gsap.core.Timeline, stops: number[]) {
  let movement: gsap.core.Tween | undefined;
  let lastInput = 0;
  let direction = 0;
  let touchY: number | null = null;
  let settleTimer: ReturnType<typeof setTimeout>;
  let disposed = false;
  const advance = (delta: number) => {
    const trigger = timeline.scrollTrigger;
    if (!trigger || document.documentElement.classList.contains("section-transitioning") ||
        document.documentElement.classList.contains("desktop-menu-open") ||
        document.getElementById("mobile-menu")?.classList.contains("translate-x-0")) return false;
    const sign = Math.sign(delta);
    const now = performance.now();
    const continuingGesture = sign === direction && now - lastInput < 180;
    // Consume the rest of the gesture even if the pin changes state on its
    // boundary. Otherwise its trailing wheel events can move the whole page.
    if (movement?.isActive() || continuingGesture) {
      lastInput = now;
      return true;
    }
    if (!trigger.isActive) return false;
    const next = sign > 0
      ? stops.find(stop => stop > trigger.progress + 0.005)
      : [...stops].reverse().find(stop => stop < trigger.progress - 0.005);
    if (next === undefined) return false;
    lastInput = now;
    direction = sign;
    const position = { y: window.scrollY };
    // Stay inside the pin at both ends. Exact start/end positions release it
    // while the first/last content animation is finishing.
    const inset = Math.min(2, (trigger.end - trigger.start) / 4);
    const target = Math.max(trigger.start + inset,
      Math.min(trigger.end - inset, trigger.start + (trigger.end - trigger.start) * next));
    movement = gsap.to(position, {
      y: target,
      duration: 0.65, ease: "power2.inOut",
      onUpdate: () => {
        window.scrollTo({ top: position.y, behavior: "instant" });
        ScrollTrigger.update();
      },
    });
    return true;
  };
  const wheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.ctrlKey || !event.deltaY ||
        (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable='true']"))) return;
    if (advance(event.deltaY)) event.preventDefault();
  };
  const start = (event: TouchEvent) => { touchY = event.touches.length === 1 ? event.touches[0].clientY : null; };
  const move = (event: TouchEvent) => {
    if (touchY === null || event.touches.length !== 1) return;
    const delta = touchY - event.touches[0].clientY;
    if (Math.abs(delta) < 12) return;
    if (advance(delta)) { event.preventDefault(); touchY = event.touches[0].clientY; }
  };
  const end = () => { touchY = null; };
  // A native gesture may enter the pin from outside, before the wheel handler
  // owns it. Finish that step too, as well as keyboard/scrollbar movement.
  const settle = () => {
    if (disposed || movement?.isActive()) return;
    const trigger = timeline.scrollTrigger;
    if (!trigger?.isActive || document.documentElement.classList.contains("section-transitioning")) return;
    if (stops.some(stop => Math.abs(stop - trigger.progress) < 0.005)) return;
    lastInput = -Infinity;
    advance(trigger.direction || 1);
  };
  const scroll = () => {
    clearTimeout(settleTimer);
    if (!movement?.isActive()) settleTimer = setTimeout(settle, 150);
  };
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("wheel", wheel, { passive: false, capture: true });
  window.addEventListener("touchstart", start, { passive: true });
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("touchend", end);
  return () => {
    disposed = true;
    clearTimeout(settleTimer);
    window.removeEventListener("scroll", scroll);
    movement?.kill();
    window.removeEventListener("wheel", wheel, true);
    window.removeEventListener("touchstart", start);
    window.removeEventListener("touchmove", move);
    window.removeEventListener("touchend", end);
  };
}
