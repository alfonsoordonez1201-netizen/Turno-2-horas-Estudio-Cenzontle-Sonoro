'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BLOQUES,
  DIAS,
  type Bloque,
  type Reserva,
  type SalaId,
  SALAS,
  aISO,
  cargarReservas,
  claveDe,
  corta,
  horaDe,
  larga,
  liberarFechas,
  lunesBase,
  rangoSemana,
  salaPorId,
  sumarDias,
} from '@/lib/reservas';

import { ReservaDialog } from './reserva-dialog';
import { VuMeter, nivelDe } from './vu-meter';

const botonNav =
  'rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-sm font-bold text-zinc-100 transition-colors hover:border-glow hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none';

export function Estudio() {
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [base, setBase] = useState<Date | null>(null);
  const [semana, setSemana] = useState(0);
  const [salaId, setSalaId] = useState<SalaId>('cabina-voz');
  const [elegido, setElegido] = useState<{ fecha: string; bloque: Bloque } | null>(null);
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // localStorage solo se lee en el navegador, después de hidratar: así servidor y cliente coinciden.
  useEffect(() => {
    const hoy = new Date();
    setBase(lunesBase(hoy));
    setReservas(cargarReservas(hoy));
  }, []);

  const cerrar = useCallback(() => setElegido(null), []);
  const alGuardar = useCallback((lista: Reserva[]) => setReservas(lista), []);

  const lunes = useMemo(() => (base ? sumarDias(base, semana * 7) : null), [base, semana]);
  const fechas = useMemo(() => (lunes ? DIAS.map((_, i) => aISO(sumarDias(lunes, i))) : []), [lunes]);
  const sala = salaPorId(salaId);

  const ocupados = useMemo(() => new Set((reservas ?? []).map((r) => claveDe(r.sala, r.fecha, r.bloque))), [reservas]);
  const delaSemana = (reservas ?? []).filter((r) => fechas.includes(r.fecha));
  const total = SALAS.length * DIAS.length * BLOQUES.length;

  function liberarSemana() {
    if (!lunes) return;
    const ok = window.confirm(
      `¿Liberar la semana del ${rangoSemana(lunes)}? Se borran todas las reservas de las tres salas y los ${total} bloques quedan libres.`,
    );
    if (!ok) return;
    try {
      const { lista, borradas } = liberarFechas(fechas);
      setReservas(lista);
      setAviso({
        tipo: 'ok',
        texto: borradas
          ? `Semana liberada: se borraron ${borradas} ${borradas === 1 ? 'reserva' : 'reservas'}. Los ${total} bloques están libres.`
          : `Esa semana ya estaba libre: los ${total} bloques están disponibles.`,
      });
    } catch {
      setAviso({ tipo: 'error', texto: 'No pudimos borrar las reservas del navegador. Probá de nuevo.' });
    }
  }

  function irA(n: number) {
    setSemana(n);
    setAviso(null);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* 1. La sala */}
      <section aria-labelledby="salas-titulo" className="py-12 sm:py-16" id="salas">
        <h2 className="font-display text-3xl text-white sm:text-4xl" id="salas-titulo">
          Primero, la sala
        </h2>
        <p className="mt-2 max-w-prose text-zinc-400">Tres cuartos, tres precios, bloques de dos horas.</p>

        <div aria-label="Salas del estudio" className="mt-8 grid gap-3 sm:grid-cols-3" role="tablist">
          {SALAS.map((s, i) => {
            const activa = s.id === salaId;
            return (
              <button
                aria-controls="sala-detalle"
                aria-selected={activa}
                className={`group relative rounded-lg border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none ${
                  activa
                    ? 'border-brand bg-brand/10 shadow-[0_0_32px_-6px_var(--color-brand)]'
                    : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-600'
                }`}
                id={`tab-${s.id}`}
                key={s.id}
                onClick={() => {
                  setSalaId(s.id);
                  setAviso(null);
                }}
                role="tab"
                type="button"
              >
                <span className="flex items-center justify-between gap-3 text-xs font-bold text-zinc-400">
                  <span>CANAL {i + 1}</span>
                  <span className={activa ? 'text-glow' : ''}>{activa ? 'SELECCIONADA' : 'SELECCIONAR'}</span>
                </span>
                <span className="mt-2 block font-display text-2xl text-white">{s.nombre}</span>
                <span className="mt-3 block">
                  <VuMeter nivel={activa ? 9 : 3} vivo={activa} />
                </span>
              </button>
            );
          })}
        </div>

        <div
          aria-labelledby={`tab-${salaId}`}
          className="mt-4 grid gap-6 rounded-lg border border-zinc-800 bg-zinc-900/70 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center"
          id="sala-detalle"
          role="tabpanel"
        >
          <div className="min-w-0">
            <h3 className="font-display text-2xl text-white">{sala.nombre}</h3>
            <p className="mt-2 max-w-prose text-base leading-7 text-zinc-300">{sala.descripcion}</p>
          </div>
          <dl className="flex gap-3 sm:gap-4">
            <div className="-rotate-1 bg-paper px-4 py-3 text-zinc-900">
              <dt className="text-xs font-bold">AFORO</dt>
              <dd className="mt-0.5 text-lg font-bold">hasta {sala.aforo}</dd>
            </div>
            <div className="rotate-1 bg-paper px-4 py-3 text-zinc-900">
              <dt className="text-xs font-bold">PRECIO</dt>
              <dd className="mt-0.5 text-lg font-bold">${sala.precio} MXN / 2h</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 2. La semana */}
      <section aria-labelledby="semana-titulo" className="pb-16 sm:pb-24" id="reservas">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-3xl text-white sm:text-4xl" id="semana-titulo">
              Después, el bloque
            </h2>
            <p className="mt-2 text-zinc-400" aria-live="polite">
              {lunes ? (
                <>
                  Semana del {rangoSemana(lunes)} · <span className="text-white">{sala.nombre}</span>
                </>
              ) : (
                'Cargando la semana…'
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={botonNav} disabled={!lunes} onClick={() => irA(semana - 1)} type="button">
              ← Semana anterior
            </button>
            {semana !== 0 ? (
              <button className={botonNav} onClick={() => irA(0)} type="button">
                Esta semana
              </button>
            ) : null}
            <button className={botonNav} disabled={!lunes} onClick={() => irA(semana + 1)} type="button">
              Semana siguiente →
            </button>
          </div>
        </div>

        {lunes && reservas ? (
          <>
            <p className="mt-4 text-sm text-zinc-400">
              {delaSemana.length} de {total} bloques ocupados en las tres salas esta semana.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
              {DIAS.map((dia, i) => {
                const fecha = fechas[i];
                const libres = BLOQUES.filter((b) => !ocupados.has(claveDe(salaId, fecha, b))).length;
                return (
                  <article className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3" key={fecha}>
                    <header className="flex items-baseline justify-between gap-2 border-b border-dashed border-zinc-700 pb-2">
                      <h3 className="font-display text-xl text-white">{dia}</h3>
                      <span className="text-sm text-zinc-400">{corta(fecha)}</span>
                    </header>
                    {libres === 0 ? (
                      <p className="mt-2 text-sm font-bold text-glow">Sin bloques libres</p>
                    ) : (
                      <p className="mt-2 text-xs text-zinc-400">
                        {libres} {libres === 1 ? 'libre' : 'libres'}
                      </p>
                    )}
                    <ul className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-1">
                      {BLOQUES.map((b) => {
                        const ocupado = ocupados.has(claveDe(salaId, fecha, b));
                        const cabecera = (
                          <>
                            <span className="block truncate text-xs font-bold">{sala.nombre}</span>
                            <span className="mt-0.5 block text-sm font-bold">
                              {corta(fecha)} · {horaDe(b)}
                            </span>
                          </>
                        );
                        return (
                          <li key={b}>
                            {ocupado ? (
                              <button
                                aria-disabled="true"
                                aria-label={`${sala.nombre}, ${larga(fecha)}, ${horaDe(b)}: Ocupado`}
                                className="block w-full cursor-not-allowed rounded-md border border-zinc-800 bg-black p-2.5 text-left text-zinc-300"
                                disabled
                                type="button"
                              >
                                {cabecera}
                                <span className="mt-2 block">
                                  <VuMeter nivel={nivelDe(claveDe(salaId, fecha, b))} />
                                </span>
                                <span className="mt-1.5 block text-xs font-bold text-glow">Ocupado</span>
                              </button>
                            ) : (
                              <button
                                aria-label={`${sala.nombre}, ${larga(fecha)}, ${horaDe(b)}: Libre`}
                                className="block w-full rounded-md bg-paper p-2.5 text-left text-zinc-900 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_0_20px_-2px_var(--color-brand)] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:outline-none"
                                onClick={() => setElegido({ fecha, bloque: b })}
                                type="button"
                              >
                                {cabecera}
                                <span className="mt-2 flex items-center gap-1.5 text-xs font-bold">
                                  <span className="size-2 rounded-full bg-emerald-600" />
                                  Libre
                                </span>
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div aria-hidden="true" className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="h-48 animate-pulse rounded-lg bg-zinc-900" key={i} />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 border-t border-dashed border-zinc-700 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-prose text-sm text-zinc-400">
            ¿Se cayó todo o querés arrancar de cero? Liberar borra las reservas de la semana que estás viendo, en las tres
            salas.
          </p>
          <button
            className="shrink-0 rounded-md border border-brand px-5 py-3 text-base font-bold text-glow transition-colors hover:bg-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:outline-none disabled:opacity-50"
            disabled={!lunes}
            onClick={liberarSemana}
            type="button"
          >
            Liberar la semana
          </button>
        </div>
        {aviso ? (
          <p
            className={`mt-4 rounded-md border p-3 text-sm ${
              aviso.tipo === 'ok' ? 'border-signal/40 bg-signal/10 text-zinc-100' : 'border-brand/60 bg-brand/10 text-white'
            }`}
            role={aviso.tipo === 'ok' ? 'status' : 'alert'}
          >
            {aviso.texto}
          </p>
        ) : null}
      </section>

      {elegido ? (
        <ReservaDialog
          bloque={elegido.bloque}
          fecha={elegido.fecha}
          key={`${salaId}|${elegido.fecha}|${elegido.bloque}`}
          onClose={cerrar}
          onGuardada={alGuardar}
          sala={salaId}
        />
      ) : null}
    </div>
  );
}
