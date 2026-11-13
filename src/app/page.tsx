import { Estudio } from '@/components/estudio/estudio';
import { VuMeter } from '@/components/estudio/vu-meter';

const canales = [
  { nombre: 'Cabina voz', nivel: 7 },
  { nombre: 'Sala banda', nivel: 10 },
  { nombre: 'Control mezcla', nivel: 5 },
];

export default function Home() {
  return (
    <main>
      <header className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-4 sm:px-6 sm:pt-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="min-w-0">
          <p className="inline-block -rotate-2 bg-paper px-3 py-1 text-sm font-bold text-zinc-900">
            Reservas · bloques de 2 horas · lunes a sábado
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] text-white [text-shadow:0_0_28px_var(--color-brand)] sm:text-7xl">
            Estudio <span className="text-glow">Cenzontle</span> Sonoro
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-8 text-zinc-300">
            Ponele día y hora a tu grabación. Elegí la sala, tocá un bloque libre y listo: te bajás el archivo para
            agendarlo. Sin cuentas, sin vueltas, de músico a músico.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="rounded-md bg-brand px-6 py-3.5 text-center text-base font-bold text-white shadow-[0_0_32px_-4px_var(--color-brand)] transition-colors hover:bg-glow focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              href="#reservas"
            >
              Ver la semana
            </a>
            <a
              className="rounded-md border border-zinc-600 px-6 py-3.5 text-center text-base font-bold text-zinc-100 transition-colors hover:border-glow hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              href="#salas"
            >
              Conocer las salas
            </a>
          </div>
        </div>

        <aside
          aria-label="Medidores de las tres salas"
          className="rounded-xl border border-zinc-800 bg-black/70 p-5 shadow-[0_0_80px_-30px_var(--color-brand)] sm:p-6"
        >
          <ul className="grid gap-5">
            {canales.map((c, i) => (
              <li key={c.nombre}>
                <p className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-zinc-400">
                  <span>CH {i + 1} · {c.nombre.toUpperCase()}</span>
                  <span className="text-zinc-500">dB</span>
                </p>
                <VuMeter className="h-5" nivel={c.nivel} />
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-dashed border-zinc-700 pt-4 text-sm text-zinc-400">
            Cuando el medidor de un bloque está prendido, ese bloque está ocupado.
          </p>
        </aside>
      </header>

      <Estudio />

      <footer className="border-t border-zinc-800 py-8 text-sm text-zinc-400">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 sm:flex-row sm:justify-between sm:px-6">
          <p className="font-display text-lg text-white">Estudio Cenzontle Sonoro</p>
          <p className="max-w-prose">
            Las reservas quedan guardadas en este navegador (localStorage). No hay cuentas ni pagos en línea: el precio es
            de referencia por bloque de 2 horas.
          </p>
        </div>
      </footer>
    </main>
  );
}
