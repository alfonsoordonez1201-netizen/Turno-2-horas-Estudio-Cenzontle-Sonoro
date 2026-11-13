'use client';

import { useEffect, useRef, useState } from 'react';

import {
  type Bloque,
  type Reserva,
  type SalaId,
  corta,
  correoValido,
  descargarIcs,
  guardarReserva,
  horaDe,
  larga,
  normalizarCorreo,
  nuevoId,
  salaPorId,
} from '@/lib/reservas';

const campo =
  'w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 placeholder:text-zinc-500 transition-colors focus:border-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50';
const etiqueta = 'mb-1.5 block text-sm font-bold text-zinc-200';
const errorTxt = 'mt-1.5 text-sm text-glow';

export function ReservaDialog({
  sala,
  fecha,
  bloque,
  onClose,
  onGuardada,
}: {
  sala: SalaId;
  fecha: string;
  bloque: Bloque;
  onClose: () => void;
  onGuardada: (lista: Reserva[]) => void;
}) {
  const info = salaPorId(sala);
  const esBanda = sala === 'sala-banda';
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [nota, setNota] = useState('');
  const [musicos, setMusicos] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [hecha, setHecha] = useState<Reserva | null>(null);
  const primero = useRef<HTMLInputElement>(null);

  useEffect(() => {
    primero.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', alTeclear);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = previo;
    };
  }, [onClose]);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    const nom = nombre.trim();
    const mail = normalizarCorreo(correo);
    if (!nom) err.nombre = 'Decinos tu nombre o el de la banda.';
    if (!mail) err.correo = 'Dejanos un correo para la reserva.';
    else if (!correoValido(mail)) err.correo = 'El correo tiene que terminar en @example.com.';
    let cant = 0;
    if (esBanda) {
      cant = Number(musicos);
      if (musicos.trim() === '' || !Number.isInteger(cant) || cant < 1 || cant > 8) {
        err.musicos = 'Poné un número de músicos entre 1 y 8.';
      }
    }
    setErrores(err);
    setErrorGeneral('');
    if (Object.keys(err).length) return;

    const reserva: Reserva = {
      id: nuevoId(),
      sala,
      fecha,
      bloque,
      nombre: nom,
      correo: mail,
      nota: nota.trim(),
      ...(esBanda ? { musicos: cant } : {}),
    };
    try {
      const res = guardarReserva(reserva);
      if (!res.ok) {
        setErrorGeneral('Ese bloque ya está reservado. Cerrá este panel y elegí otro horario.');
        return;
      }
      onGuardada(res.lista);
    } catch {
      setErrorGeneral('No pudimos guardar la reserva en tu navegador. Tus datos siguen acá: probá de nuevo.');
      return;
    }
    setCorreo(mail);
    setHecha(reserva);
    try {
      descargarIcs(reserva);
    } catch {
      // la reserva ya está guardada; el .ics se puede bajar de nuevo desde el botón
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        aria-label="Cerrar"
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div
        aria-labelledby="reserva-titulo"
        aria-modal="true"
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-[0_0_60px_-10px_var(--color-brand)] sm:max-w-lg sm:rounded-2xl sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="inline-block -rotate-1 bg-paper px-2 py-0.5 text-xs font-bold text-zinc-900">
              {info.nombre} · {corta(fecha)} · {horaDe(bloque)}
            </p>
            <h2 className="mt-3 font-display text-2xl text-white sm:text-3xl" id="reserva-titulo">
              {hecha ? 'Reserva guardada' : 'Reservá este bloque'}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {larga(fecha)}, de {horaDe(bloque)} a {String(Number(bloque) + 2).padStart(2, '0')}:00 · ${info.precio} MXN
            </p>
          </div>
          <button
            aria-label="Cerrar"
            className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1 text-lg leading-none text-zinc-300 transition-colors hover:border-brand hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        {hecha ? (
          <div className="mt-6" role="status">
            <p className="rounded-md border border-signal/40 bg-signal/10 p-4 text-base text-zinc-100">
              Listo, {hecha.nombre}: quedó anotada la {info.nombre} para el {larga(hecha.fecha).toLowerCase()} a las{' '}
              {horaDe(hecha.bloque)}. Te bajamos el archivo .ics para que lo agendes; si no se descargó, tocá el botón.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-md bg-brand px-5 py-3 text-base font-bold text-white shadow-[0_0_24px_-4px_var(--color-brand)] transition-colors hover:bg-glow focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
                onClick={() => descargarIcs(hecha)}
                type="button"
              >
                Bajar el .ics de nuevo
              </button>
              <button
                className="rounded-md border border-zinc-600 px-5 py-3 text-base font-bold text-zinc-100 transition-colors hover:border-glow hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                onClick={onClose}
                type="button"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form className="mt-6 grid gap-4" noValidate onSubmit={enviar}>
            <div>
              <label className={etiqueta} htmlFor="r-nombre">
                Nombre
              </label>
              <input
                autoComplete="name"
                className={campo}
                id="r-nombre"
                name="nombre"
                onChange={(e) => setNombre(e.target.value)}
                ref={primero}
                required
                type="text"
                value={nombre}
              />
              {errores.nombre ? <p className={errorTxt}>{errores.nombre}</p> : null}
            </div>
            <div>
              <label className={etiqueta} htmlFor="r-correo">
                Correo
              </label>
              <input
                autoComplete="email"
                className={campo}
                id="r-correo"
                inputMode="email"
                name="correo"
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ejemplo@example.com"
                required
                type="text"
                value={correo}
              />
              {errores.correo ? <p className={errorTxt}>{errores.correo}</p> : null}
            </div>
            {esBanda ? (
              <div>
                <label className={etiqueta} htmlFor="r-musicos">
                  Cantidad de músicos
                </label>
                <input
                  className={campo}
                  id="r-musicos"
                  inputMode="numeric"
                  max={8}
                  min={1}
                  name="musicos"
                  onChange={(e) => setMusicos(e.target.value)}
                  required
                  type="number"
                  value={musicos}
                />
                <p className="mt-1.5 text-xs text-zinc-400">De 1 a 8: la sala aguanta hasta ocho.</p>
                {errores.musicos ? <p className={errorTxt}>{errores.musicos}</p> : null}
              </div>
            ) : null}
            <div>
              <label className={etiqueta} htmlFor="r-nota">
                Nota <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <textarea
                className={`${campo} min-h-20 resize-y`}
                id="r-nota"
                name="nota"
                onChange={(e) => setNota(e.target.value)}
                rows={3}
                value={nota}
              />
            </div>
            {errorGeneral ? (
              <p className="rounded-md border border-brand/60 bg-brand/10 p-3 text-sm text-white" role="alert">
                {errorGeneral}
              </p>
            ) : null}
            <button
              className="rounded-md bg-brand px-5 py-3 text-base font-bold text-white shadow-[0_0_24px_-4px_var(--color-brand)] transition-colors hover:bg-glow focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              type="submit"
            >
              Confirmar reserva
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
