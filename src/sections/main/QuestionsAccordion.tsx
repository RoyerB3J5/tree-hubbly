import { useState, useEffect, useRef } from "react";

type Translations = typeof import("../../i18n/en-2").default;
type Content = Translations["main"]["ask"];

interface Props {
  content: Content;
}

export default function QuestionsAccordion({ content }: Props) {
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(() => new Set());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    if (titleRef.current) observer.observe(titleRef.current);
    if (descRef.current) observer.observe(descRef.current);
    containerRef.current
      ?.querySelectorAll(".question-item")
      .forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const toggleAccordion = (index: number) => {
    setOpenIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <section className=" flex flex-col justify-center items-center w-full bg-paragraph">
      <div className="container-full gap-8 md:gap-10 flex flex-col justify-center items-center py-12 md:py-20 ">
        <h2
          ref={titleRef}
          dangerouslySetInnerHTML={{ __html: content.title }}
          className="text-primary text-start md:text-center heading-h4"
        ></h2>
        <div
          ref={containerRef}
          className="w-full flex flex-col justify-start items-center gap-4 md:gap-8"
        >
          {content.questions.map((item, index) => (
            <div
              key={index}
              className={`question-item fade-up-a w-full flex justify-between px-4 py-6 md:p-6 bg-white rounded-3xl transition-all duration-300 ease-in-out ${
                openIndexes.has(index) ? "items-start" : "items-center"
              }`}
            >
              <div
                className={`flex flex-col justify-start items-start w-full transition-all duration-300 ease-in-out ${
                  openIndexes.has(index) ? "gap-6" : "gap-0"
                }`}
              >
                <div className="w-full flex justify-between items-center md:items-start gap-3 md:gap-18.25">
                  <h3 className="subtitle-lg text-primary w-full">{item.title}</h3>
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="shrink-0 md:ml-4 bg-none border-none cursor-pointer p-0 hover:opacity-80 transition-opacity block md:hidden"
                    aria-label={
                      openIndexes.has(index) ? "Cerrar pregunta" : "Abrir pregunta"
                    }
                  >
                    <img
                      src={
                        openIndexes.has(index)
                          ? "/images/minus.svg"
                          : "/images/plus.svg"
                      }
                      alt={openIndexes.has(index) ? "Menos" : "Más"}
                      width="24"
                      height="24"
                      className="w-8 h-8"
                      decoding="async"
                      loading="lazy"
                    />
                  </button>
                </div>

                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out w-full md:w-[80%] ${
                    openIndexes.has(index)
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className="body-md text-primary py-1 [text-box-trim:none] [&_*]:[text-box-trim:none] [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li+li]:mt-2"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleAccordion(index)}
                className="shrink-0 ml-4 bg-none border-none cursor-pointer p-0 hover:opacity-80 transition-opacity hidden md:block"
                aria-label={
                  openIndexes.has(index) ? "Cerrar pregunta" : "Abrir pregunta"
                }
              >
                <img
                  src={
                    openIndexes.has(index)
                      ? "/images/minus.svg"
                      : "/images/plus.svg"
                  }
                  alt={openIndexes.has(index) ? "Menos" : "Más"}
                  width="24"
                  height="24"
                  className="w-8 h-8"
                  decoding="async"
                  loading="lazy"
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
