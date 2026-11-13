// Import this module from client-side scripts that need GSAP and ScrollTrigger.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let menuPins: Array<{ pin: HTMLElement; style: string | null; parent: HTMLElement; position: string }> = [];
document.addEventListener("site-menu-opening", () => {
  if (menuPins.length) return;
  const page = document.getElementById("page-content");
  ScrollTrigger.getAll().forEach(trigger => {
    const pin = trigger.pin as HTMLElement | undefined;
    if (!pin || !page?.contains(pin) || getComputedStyle(pin).position !== "fixed") return;
    const parent = pin.parentElement!;
    const rect = pin.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    menuPins.push({ pin, style: pin.getAttribute("style"), parent, position: parent.style.position });
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    Object.assign(pin.style, {
      position: "absolute",
      top: `${rect.top - parentRect.top - parent.clientTop + parent.scrollTop}px`,
      left: `${rect.left - parentRect.left - parent.clientLeft + parent.scrollLeft}px`,
      width: `${rect.width}px`, height: `${rect.height}px`, transform: "none",
    });
  });
});
document.addEventListener("site-menu-closed", () => {
  menuPins.forEach(({ pin, style, parent, position }) => {
    if (style === null) pin.removeAttribute("style");
    else pin.setAttribute("style", style);
    parent.style.position = position;
  });
  menuPins = [];
  ScrollTrigger.update();
});

export { gsap, ScrollTrigger };
