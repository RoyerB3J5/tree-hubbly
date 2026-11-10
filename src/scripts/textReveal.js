// Shared text reveal for all page layouts.
function initTextReveal() {
    const textRevealSelector = "h1, h2, h3, h4, h5, h6, p";
    const lineRevealElements = [...document.querySelectorAll(`main ${textRevealSelector.split(", ").join(", main ")}`)]
      .filter((element) => !element.matches(".numbers-counter") && !element.closest("a, button"));
    lineRevealElements.forEach((element) => element.classList.add("fade-up-lines-raw"));

    const lineRevealRoots = [...lineRevealElements].filter(
      (element) => !element.parentElement?.closest(textRevealSelector)
    );

    const prepareLineReveal = (element) => {
      element
        .querySelectorAll(".fade-up-line-word, .fade-up-line-fragment")
        .forEach((wrapper) => {
          wrapper.replaceWith(...wrapper.childNodes);
        });

      const textNodes = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node;

      while ((node = walker.nextNode())) {
        if (/\S/.test(node.textContent ?? "") && !node.parentElement?.closest("a, button")) {
          textNodes.push(node);
        }
      }

      textNodes.forEach((textNode) => {
        const tokens = textNode.textContent.match(/\s+|\S+/gu) ?? [];
        const fragment = document.createDocumentFragment();

        tokens.forEach((token) => {
          if (/^\s+$/u.test(token)) {
            fragment.append(document.createTextNode(token));
            return;
          }

          const word = document.createElement("span");
          word.className = "fade-up-line-word";

          const wordFragment = document.createElement("span");
          wordFragment.className = "fade-up-line-fragment";
          wordFragment.textContent = token;

          word.append(wordFragment);
          fragment.append(word);
        });

        textNode.replaceWith(fragment);
      });

      const words = [...element.querySelectorAll(".fade-up-line-word")];
      const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
      const lineTolerance = Number.isFinite(lineHeight) ? lineHeight * 0.35 : 4;
      let lineIndex = -1;
      let previousTop = null;

      words.forEach((word) => {
        const top = word.getBoundingClientRect().top;

        if (
          previousTop === null ||
          Math.abs(top - previousTop) > lineTolerance
        ) {
          lineIndex += 1;
          previousTop = top;
        }

        word.firstElementChild.style.setProperty(
          "--fade-up-line-delay",
          `${lineIndex * 0.1}s`
        );
      });
    };

    lineRevealRoots.forEach(prepareLineReveal);

    // A text reveal inside an animated container starts only after every
    // enclosing entrance animation has finished.
    const waitForContainerEntrance = (container) => new Promise((resolve) => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        resolve();
        return;
      }
      let observer;
      const check = () => {
        if (!container.classList.contains("active")) return;
        observer?.disconnect();
        requestAnimationFrame(() => {
          const animations = container.getAnimations().filter((animation) =>
            "animationName" in animation &&
            (animation.playState === "running" || animation.playState === "pending")
          );
          Promise.allSettled(animations.map((animation) => animation.finished)).then(resolve);
        });
      };
      if (!container.classList.contains("active")) {
        observer = new MutationObserver(check);
        observer.observe(container, { attributes: true, attributeFilter: ["class"] });
      }
      check();
    });
    const revealAfterContainers = (element) => {
      const containers = [];
      let ancestor = element.parentElement;
      while (ancestor) {
        if (ancestor.matches(".fade-up-a, .fade-down-a, .fade-left-a, .fade-right-a")) containers.push(ancestor);
        ancestor = ancestor.parentElement;
      }
      Promise.all(containers.map(waitForContainerEntrance)).then(() => {
        requestAnimationFrame(() => element.classList.add("active"));
      });
    };

    if ("IntersectionObserver" in window) {
      const lineRevealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.3) {
              return;
            }

            revealAfterContainers(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: [0.3, 0.55] }
      );

      lineRevealRoots.forEach((element) => {
        if (!element.closest("[data-reveal-sequence], .steps-scroll-controlled .steps-card, .reasons-section.is-pinned .reasons-slide, .system-reasons.is-pinned .system-reasons-slide, .numbers-reveal-controlled .numbers-card, .control-scroll-controlled .control-item")) lineRevealObserver.observe(element);
      });
    } else {
      lineRevealRoots.forEach((element) => element.classList.add("active"));
    }

    window.addEventListener("resize", () => {
      lineRevealRoots.forEach(prepareLineReveal);
    });

}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTextReveal, { once: true });
} else {
  initTextReveal();
}
