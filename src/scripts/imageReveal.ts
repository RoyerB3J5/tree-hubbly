// Prepare a stable image wrapper and reveal only once its image can be painted.
export function prepareImageReveal(element: HTMLElement) {
  element.classList.add("reveal-ready");
  let started = false;
  return () => {
    if (started) return;
    started = true;
    const image = element.querySelector<HTMLImageElement>("img");
    const reveal = () => {
      void getComputedStyle(element).transform;
      element.classList.add("active");
    };
    if (image && !image.complete) {
      image.loading = "eager";
      image.addEventListener("load", reveal, { once: true });
      image.addEventListener("error", reveal, { once: true });
    } else reveal();
  };
}
