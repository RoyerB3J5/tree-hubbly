import { ScrollTrigger } from "./gsap";

// Pin start/end values depend on the size of every preceding section, including
// late iframe, image and font layout changes. Observe the content, not spacers:
// spacer padding changes during refresh and must not trigger another refresh.
export function observeSectionLayout(main: HTMLElement) {
  const sections = Array.from(main.querySelectorAll<HTMLElement>(
    ":scope > section, :scope > .questions-section, :scope > .pin-spacer > section"
  ));
  const heights = new Map(sections.map(section => [section, section.offsetHeight]));
  let frame = 0;
  let queued = false;
  let refreshing = false;
  const snapshot = () => sections.forEach(section => heights.set(section, section.offsetHeight));
  const flush = () => {
    frame = 0;
    if (!queued || refreshing || document.body.classList.contains("menu-transitioning")) return;
    queued = false;
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  };
  const schedule = () => {
    queued = true;
    if (!frame) frame = requestAnimationFrame(flush);
  };
  const beforeRefresh = () => { refreshing = true; };
  const afterRefresh = () => { snapshot(); refreshing = false; };
  ScrollTrigger.addEventListener("refreshInit", beforeRefresh);
  ScrollTrigger.addEventListener("refresh", afterRefresh);
  const observer = new ResizeObserver(entries => {
    if (refreshing) return;
    if (entries.some(entry => {
      const section = entry.target as HTMLElement;
      return Math.abs(section.offsetHeight - (heights.get(section) ?? 0)) > 1;
    })) schedule();
  });
  sections.forEach(section => observer.observe(section));
  const menuObserver = new MutationObserver(() => { if (queued && !frame) frame = requestAnimationFrame(flush); });
  menuObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  document.fonts.ready.then(schedule);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    menuObserver.disconnect();
    ScrollTrigger.removeEventListener("refreshInit", beforeRefresh);
    ScrollTrigger.removeEventListener("refresh", afterRefresh);
  };
}
