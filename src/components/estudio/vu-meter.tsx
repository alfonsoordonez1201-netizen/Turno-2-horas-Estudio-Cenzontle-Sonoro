// Medidor VU de LEDs: cuanto más alto el nivel, más segmentos prendidos (verde, ámbar, rosa al pico).
const SEGMENTOS = 10;

const lit = (i: number) =>
  i >= 8
    ? 'bg-brand shadow-[0_0_8px_2px_var(--color-brand)]'
    : i >= 6
      ? 'bg-accent shadow-[0_0_7px_1px_var(--color-accent)]'
      : 'bg-signal shadow-[0_0_6px_1px_var(--color-signal)]';

export function VuMeter({ nivel, vivo = true, className = '' }: { nivel: number; vivo?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`flex h-2.5 w-full items-stretch gap-0.5 ${className}`}>
      {Array.from({ length: SEGMENTOS }, (_, i) => {
        const on = i < nivel;
        const punta = on && i >= nivel - 2;
        return (
          <span
            key={i}
            className={`flex-1 rounded-[1px] ${on ? lit(i) : 'bg-zinc-800'} ${vivo && punta ? 'vu-live' : ''}`}
            style={vivo && punta ? { animationDelay: `${(i % 4) * 190}ms` } : undefined}
          />
        );
      })}
    </span>
  );
}

/** Nivel estable (5 a 10) a partir de un texto, para que cada bloque ocupado tenga su propio medidor. */
export function nivelDe(texto: string): number {
  let h = 7;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) % 9973;
  return 5 + (h % 6);
}
