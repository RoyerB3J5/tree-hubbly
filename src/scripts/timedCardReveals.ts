import { gsap } from "./gsap";
import { prepareImageReveal } from "./imageReveal";

const cardDuration = 0.28;
const cardStagger = 0.4;
const firstCardDelay = 0.12;
const visibilityThreshold = 0.3;
const activate = (element: Element) => element.classList.add("active");

function prepareCard(card: HTMLElement, steps: boolean) {
  const text = card.querySelectorAll("h3, p");
  const content = steps ? card.querySelectorAll(".steps-card-content") : text;
  const icon = card.querySelector(".control-item-icon");
  gsap.set(card, { autoAlpha: 0, "--fade-up-line-duration": "0.36s" });
  gsap.set(content, { autoAlpha: 0 });
  if (icon) gsap.set(icon, { x: 16, autoAlpha: 0 });
  text.forEach((element, index) => {
    element.classList.remove("active");
    gsap.set(element, { "--fade-up-lines-delay": `${index * 0.05}s` });
  });
  return { card, content, text, icon };
}

function queueCard(timeline: gsap.core.Timeline, { card, content, text, icon }: ReturnType<typeof prepareCard>, at: number) {
  const contentStart = at + cardDuration;
  timeline.fromTo(card, { yPercent: 100 }, {
    yPercent: 0, autoAlpha: 1, duration: cardDuration, ease: "power2.out", immediateRender: false,
  }, at)
    .set(content, { autoAlpha: 1 }, contentStart)
    .call(() => text.forEach(activate), [], contentStart);
  if (icon) timeline.to(icon, { x: 0, autoAlpha: 1, duration: 0.22, ease: "power2.out" }, contentStart);
}

function initTimedCardReveals() {
  const sections = [...document.querySelectorAll<HTMLElement>(".home-steps, .control-section")];
  if (!sections.length) return;

  const finish = () => sections.forEach((section) => {
    section.querySelectorAll("h2, h3, p, .animation-image-reveal").forEach(activate);
    section.querySelectorAll(".fade-up-a").forEach((element) => element.classList.remove("fade-up-a"));
  });

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finish();
    return;
  }

  let started = false;
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", (context) => {
    if (started) return;
    started = true;
    const groups: {
      cards: ReturnType<typeof prepareCard>[];
      timeline: gsap.core.Timeline;
      nextCard: number;
      nextStart: number;
    }[] = [];
    const visibleCards = new Set<Element>();
    const reveals = new Map<Element, () => void>();
    const observer = new IntersectionObserver((entries) => {
      const visible = new Set<Element>();
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < visibilityThreshold) return;
        observer.unobserve(entry.target);
        visible.add(entry.target);
      });

      context.add(() => {
        visible.forEach((target) => {
          const reveal = reveals.get(target);
          if (reveal) reveal();
          else visibleCards.add(target);
        });
        groups.forEach((group) => {
          const { timeline } = group;
          let at = Math.max(timeline.time(), group.nextStart);
          const previousCard = group.nextCard;
          // Taller cards can enter the viewport before the first card.
          while (group.nextCard < group.cards.length && visibleCards.delete(group.cards[group.nextCard].card)) {
            queueCard(timeline, group.cards[group.nextCard], at);
            group.nextCard += 1;
            at += cardStagger;
          }
          if (group.nextCard !== previousCard) {
            group.nextStart = at;
            timeline.play();
          }
        });
      });
    }, { threshold: visibilityThreshold });

    sections.forEach((section) => {
      const steps = section.matches(".home-steps");
      const lead = section.querySelectorAll(steps
        ? ".steps-tag, .steps-title, .steps-description"
        : ".control-intro :is(h2, p)");
      if (lead.length) {
        lead.forEach((element) => {
          element.classList.remove("active");
          if (steps) element.classList.add("fade-up-a");
        });
        reveals.set(lead[0], () => {
          const timeline = gsap.timeline();
          lead.forEach((element, index) => {
            timeline.call(() => activate(element), [], index * 0.1);
          });
        });
        observer.observe(lead[0]);
      }

      const image = section.querySelector<HTMLElement>(".animation-image-reveal");
      if (image) {
        const target = image.closest(".animation-image-reveal-trigger") ?? image;
        reveals.set(target, prepareImageReveal(image));
        observer.observe(target);
      }

      const cards = [...section.querySelectorAll<HTMLElement>(steps ? ".steps-card" : ".control-item")]
        .map((card) => prepareCard(card, steps));
      cards.forEach(({ card }) => observer.observe(card));
      groups.push({ cards, timeline: gsap.timeline({ paused: true }), nextCard: 0, nextStart: firstCardDelay });
    });

    return () => {
      observer.disconnect();
      finish();
    };
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => queueMicrotask(initTimedCardReveals), { once: true });
} else {
  initTimedCardReveals();
}
