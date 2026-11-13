// Keep native scrolling instant for GSAP pin corrections, and animate only
// deliberate navigation to a section on the current page.
document.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target instanceof Element)) return;

  const link = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

  const url = new URL(link.href, window.location.href);
  const normalizePath = (path: string) => path.replace(/\/+$/, "") || "/";
  if (url.origin !== location.origin || normalizePath(url.pathname) !== normalizePath(location.pathname) || url.search !== location.search || !url.hash) return;

  let id: string;
  try {
    id = decodeURIComponent(url.hash.slice(1));
  } catch {
    return;
  }
  const destination = document.getElementById(id);
  if (!destination) return;

  event.preventDefault();
  document.dispatchEvent(new Event("site-scroll-stop"));
  if (location.hash !== url.hash) history.pushState(null, "", url.hash);
  destination.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
});
