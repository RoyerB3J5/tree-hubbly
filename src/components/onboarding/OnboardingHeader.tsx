interface Props { busy: boolean; signOut: () => void; flow?: boolean; }
export default function OnboardingHeader({ busy, signOut, flow = false }: Props) {
  if (flow) {
    return (
      <header className="w-full border-b border-[#263a4b]">
        <div className="mx-auto flex min-h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-4 xl:px-20">
          <img src="/images/logo.svg" alt="Treehubly" width="164" height="33" className="h-auto w-[164px] max-w-[40%]" />
          <div className="flex items-center gap-6 text-sm leading-[1.5]">
            <span className="md:flex items-center gap-2 rounded-full border border-[#334155]/50 bg-[#1e293b]/40 px-4 py-2 text-paragraph hidden">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-secondary" />
              Sistema en Línea
            </span>
            <button type="button" disabled={busy} onClick={signOut} className="flex items-center gap-2 text-secondary disabled:opacity-50">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" className="size-4 shrink-0">
                <path d="M5.33333 4.66667H3.33333C2.59745 4.66667 2 5.26411 2 6V12C2 12.7359 2.59745 13.3333 3.33333 13.3333H12.6667C13.4026 13.3333 14 12.7359 14 12V6C14 5.26411 13.4026 4.66667 12.6667 4.66667H10.6667M10 7.33333L8 9.33333M8 9.33333L6 7.33333M8 9.33333V2.66667" stroke="#91D200" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Guardar y Salir
            </button>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="w-full border-b border-[#263a4b]">
      <div className="mx-auto flex min-h-20 w-full max-w-[1440px] items-center justify-between gap-4 px-6 py-4 xl:px-20">
        <img src="/images/logo.svg" alt="Treehubly" width="164" height="33" className="h-auto w-[164px] max-w-[40%]" />
        <div className="flex items-center gap-6 text-base leading-[1.5]">
          <span className="md:flex items-center gap-[5px] hidden ">
            <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-secondary" />
            Sistema en Línea
          </span>
          <button type="button" disabled={busy} onClick={signOut} className="font-semibold text-secondary disabled:opacity-50">
            Guardar y Salir
          </button>
        </div>
      </div>
    </header>
  );
}
