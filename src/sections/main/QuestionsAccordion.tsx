import { useState, useEffect, useRef } from "react";

type Translations = typeof import("../../i18n/en-2").default;
type Content = Translations["main"]["ask"];

interface Props {
  content: Content;
}

export default function QuestionsAccordion({ content }: Props) {
  const [openIndex, setOpenIndex] = useState(-1);
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
    containerRef.current?.querySelectorAll(".question-item").forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className=" flex flex-col justify-center items-center w-full bg-paragraph">
      <div className="container-full gap-8 md:gap-10 flex flex-col justify-center items-center py-10 md:py-20 ">
        <h2
          ref={titleRef}
          dangerouslySetInnerHTML={{ __html: content.title }}
          className="text-primary text-center heading-h4"
        ></h2>
        <div ref={containerRef} className="w-full flex flex-col justify-center items-center gap-4 md:gap-8">
          {content.questions.map((item, index) => (
            <div
              key={index}
              className="question-item fade-up-a w-full flex justify-between items-center p-4 md:p-6 bg-white rounded-3xl transition-all duration-300 ease-in-out"
            >
              <div
                className={`flex flex-col justify-start items-start w-full transition-all duration-300 ease-in-out ${
                  openIndex === index ? "gap-6" : "gap-0"
                }`}
              >
                <div className="w-full flex justify-between items-start gap-18.25">
                  <h3 className="subtitle-lg text-primary">{item.title}</h3>
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="shrink-0 ml-4 bg-none border-none cursor-pointer p-0 hover:opacity-80 transition-opacity block md:hidden"
                    aria-label={
                      openIndex === index ? "Cerrar pregunta" : "Abrir pregunta"
                    }
                  >
                    <img
                      src={
                        openIndex === index
                          ? "/images/minus.svg"
                          : "/images/plus.svg"
                      }
                      alt={openIndex === index ? "Menos" : "Más"}
                      width="24"
                      height="24"
                      className="w-8 h-8"
                      decoding="async"
                      loading="lazy"
                    />
                  </button>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out w-full md:w-[60%] ${
                    openIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-[14px] font-normal leading-[150%] text-primary">
                    {item.answer}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleAccordion(index)}
                className="shrink-0 ml-4 bg-none border-none cursor-pointer p-0 hover:opacity-80 transition-opacity hidden md:block"
                aria-label={
                  openIndex === index ? "Cerrar pregunta" : "Abrir pregunta"
                }
              >
                <img
                  src={
                    openIndex === index
                      ? "/images/minus.svg"
                      : "/images/plus.svg"
                  }
                  alt={openIndex === index ? "Menos" : "Más"}
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
