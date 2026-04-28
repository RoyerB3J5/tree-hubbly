import { useEffect, useRef } from "react";

type TraditionalList = {
  border?: string;
  icon: string;
  icon2: string;
  title: string;
  items: string[];
};

type TraditionalContent = {
  title: string;
  description: string;
  lists: TraditionalList[];
};

interface Props {
  content: TraditionalContent;
}

const GLOW_STYLES = `
  [data-glow-card] {
    position: relative;
  }
  
  /* 1. EL BORDE (Solución definitiva para el bug de Webkit en líneas rectas) */
  [data-glow-card]::before {
    content: "";
    position: absolute;
    inset: calc(var(--border-size, 2px) * -1);
    border-radius: inherit;
    /* Usamos padding en lugar de border transparente para evitar el bug de renderizado */
    padding: var(--border-size, 2px);
    pointer-events: none;
    
    background-image: 
      radial-gradient(
        circle at calc(var(--rx, 0) * 1px) calc(var(--ry, 0) * 1px),
        hsl(0 100% 100% / 0.4) 0%, 
        transparent 60px
      ),
      radial-gradient(
        circle at calc(var(--rx, 0) * 1px) calc(var(--ry, 0) * 1px),
        hsl(var(--hue, 205) 100% 50% / 1) 0%, 
        transparent 200px
      );
    background-repeat: no-repeat;
      
    /* Técnica de máscara con content-box: 100% estable en todos los navegadores */
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }

  /* 2. EL FONDO SUAVE */
  [data-glow-card]::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    background-image: radial-gradient(
      circle at calc(var(--rx, 0) * 1px) calc(var(--ry, 0) * 1px),
      hsl(var(--hue, 205) 100% 50% / 0.12) 0%, 
      transparent 150px
    );
    background-repeat: no-repeat;
  }
`;

// Card 1 → #263A4B (hue ~205), Card 2 → #91d200 (hue ~78)
const CARD_HUES = [3, 78];

export default function TraditionalSection({ content }: Props) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      cardRefs.current.forEach((card) => {
        if (!card) return;
        const rect = card.getBoundingClientRect();
        // Coordenadas relativas al card
        const rx = e.clientX - rect.left;
        const ry = e.clientY - rect.top;
        card.style.setProperty("--rx", rx.toFixed(2));
        card.style.setProperty("--ry", ry.toFixed(2));
      });
    };

    document.addEventListener("pointermove", handlePointerMove);
    return () => document.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOW_STYLES }} />
      <section className="w-full flex justify-center items-center bg-primary">
        <div className="w-full max-w-screen xl:max-w-7xl px-5 xl:px-0 flex flex-col justify-center items-center gap-8 md:gap-11 lg:gap-14 py-10 md:py-20 lg:py-30">
          <div className="flex flex-col justify-center items-center gap-8">
            <h2
              className="text-[32px] md:text-[48px] text-paragraph font-bold leading-[120%] text-center animation-zoom-in"
              dangerouslySetInnerHTML={{ __html: content.title }}
            />
            <p
              className="text-paragraph text-[12px] md:text-[14px] font-normal leading-[150%] text-center md:text-center animation-zoom-in"
              dangerouslySetInnerHTML={{ __html: content.description }}
            />
          </div>

          <div className="w-full flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6">
            {content.lists.map((list, index) => (
              <div
                key={index}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                data-glow-card
                style={
                  {
                    "--hue": CARD_HUES[index % CARD_HUES.length],
                    "--border-size": "2px",
                  } as React.CSSProperties
                }
                className={`${list.border || ""} w-full md:w-1/2 flex flex-col justify-center items-start gap-8 py-8 md:py-14 px-4 md:px-8 lg:px-14 xl:px-30 rounded-2xl md:rounded-3xl border-transparent box-border animation-zoom-in back-content`}
              >
                <div className="flex justify-start items-center gap-4">
                  <img
                    src={`/images/${list.icon}.svg`}
                    alt={list.title}
                    width="24"
                    height="24"
                    className="w-10 md:w-12 h-10 md:h-12"
                  />
                  <h3 className="text-[14px] md:text-[16px] text-paragraph font-bold leading-[150%]">
                    {list.title}
                  </h3>
                </div>

                <div className="flex flex-col justify-center items-start gap-4 md:gap-6">
                  {list.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-start items-center gap-2"
                    >
                      <img
                        src={`/images/${list.icon2}.svg`}
                        alt={`Icono ${list.icon2}`}
                        width="16"
                        height="16"
                        className="w-6 h-6"
                      />
                      <p
                        className="text-paragraph text-[12px] md:text-[14px] font-normal leading-[150%]"
                        dangerouslySetInnerHTML={{ __html: item }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
