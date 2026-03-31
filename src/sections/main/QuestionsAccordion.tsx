import { useState, useEffect, useRef } from "react";

type Translations = typeof import("../../i18n/en").default;
type QuestionsContent = Translations["main"]["questions"];

interface Props {
  content: QuestionsContent;
}

export default function QuestionsAccordion({ content }: Props) {
  const [openIndex, setOpenIndex] = useState(0);
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
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (titleRef.current) observer.unobserve(titleRef.current);
      if (descRef.current) observer.unobserve(descRef.current);
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="container-full flex flex-col justify-center items-center gap-8 md:gap-16 py-10 md:py-20 lg:py-30">
      <div className="flex flex-col justify-center items-start md:items-center gap-8">
        <h2
          ref={titleRef}
          dangerouslySetInnerHTML={{ __html: content.title }}
          className="text-[32px] md:text-[48px] font-bold leading-[130%] md:leading-[120%] text-primary text-start md:text-center animation-zoom-in-3"
        ></h2>
        <p
          ref={descRef}
          dangerouslySetInnerHTML={{ __html: content.description }}
          className="text-[12px] md:text-[14px] font-normal leading-[150%] text-[#2C2C2C] text-start md:text-center animation-zoom-in-3"
        ></p>
      </div>
      <div className="w-full flex flex-col justify-center items-center gap-4 md:gap-8">
        {content.items.map((item, index) => (
          <div
            ref={containerRef}
            key={index}
            className="w-full flex justify-between items-start p-4 md:p-6 bg-[#F3F3F4] rounded-3xl border border-[#D3D3D3] transition-all duration-300 ease-in-out animation-zoom-in-3"
          >
            <div
              className={`flex flex-col justify-start items-start w-full transition-all duration-300 ease-in-out ${
                openIndex === index ? "gap-6" : "gap-0"
              }`}
            >
              <div className="w-full flex justify-between items-center gap-18.25">
                <h3 className="text-[16px] text-primary font-extrabold leading-[150%]">
                  {item.question}
                </h3>
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
                  openIndex === index ? "/images/minus.svg" : "/images/plus.svg"
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
    </section>
  );
}
