// Reservas del estudio: catálogo fijo, fechas, almacenamiento en localStorage y archivo .ics. Sin servidor.

export type SalaId = 'cabina-voz' | 'sala-banda' | 'control-mezcla';
export type Bloque = '10' | '12' | '16' | '18';

export type Reserva = {
  id: string;
  sala: SalaId;
  fecha: string; // YYYY-MM-DD
  bloque: Bloque;
  nombre: string;
  correo: string;
  nota: string;
  musicos?: number; // solo Sala banda
};

export const STORAGE_KEY = 'cenzontle-sonoro:reservas:v1';

export const SALAS: { id: SalaId; nombre: string; aforo: number; precio: number; descripcion: string }[] = [
  {
    id: 'cabina-voz',
    nombre: 'Cabina voz',
    aforo: 2,
    precio: 900,
    descripcion:
      'Cuarto chico y callado para grabar voces, locuciones o un instrumento solo. Ideal para dejar la toma limpia sin que se cuele la calle.',
  },
  {
    id: 'sala-banda',
    nombre: 'Sala banda',
    aforo: 8,
    precio: 1800,
    descripcion:
      'Sala viva para ensayar o grabar en vivo con todo el grupo: batería, amplis, marimba y lo que cargues en la camioneta.',
  },
  {
    id: 'control-mezcla',
    nombre: 'Control mezcla',
    aforo: 3,
    precio: 1400,
    descripcion:
      'La consola para mezclar, editar y masterizar con calma, escuchando entre todos. Traé tus pistas y salí con el tema cerrado.',
  },
];

export const BLOQUES: Bloque[] = ['10', '12', '16', '18'];
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const salaPorId = (id: SalaId) => SALAS.find((s) => s.id === id) ?? SALAS[0];
export const horaDe = (b: Bloque) => `${b}:00`;
export const claveDe = (sala: SalaId, fecha: string, bloque: Bloque) => `${sala}|${fecha}|${bloque}`;

// ---- fechas (siempre locales, nunca UTC) ----
const pad = (n: number) => String(n).padStart(2, '0');
export const aISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const deISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const sumarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const corta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
export const larga = (iso: string) => {
  const d = deISO(iso);
  return `${DIAS[(d.getDay() + 6) % 7] ?? 'Domingo'} ${d.getDate()} de ${MESES[d.getMonth()]}`;
};

/** Lunes de la semana que se muestra por defecto: la actual, o la siguiente si hoy es domingo. */
export function lunesBase(hoy: Date): Date {
  const dow = hoy.getDay(); // 0 domingo
  const base = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return dow === 0 ? sumarDias(base, 1) : sumarDias(base, 1 - dow);
}

export function rangoSemana(lunes: Date): string {
  const sab = sumarDias(lunes, 5);
  const mismoMes = lunes.getMonth() === sab.getMonth();
  return mismoMes
    ? `${lunes.getDate()} al ${sab.getDate()} de ${MESES[sab.getMonth()]} de ${sab.getFullYear()}`
    : `${lunes.getDate()} de ${MESES[lunes.getMonth()]} al ${sab.getDate()} de ${MESES[sab.getMonth()]} de ${sab.getFullYear()}`;
}

/** El próximo jueves estrictamente posterior a hoy (si hoy es jueves, el de la semana que viene). */
export function proximoJueves(hoy: Date): string {
  let dias = (4 - hoy.getDay() + 7) % 7;
  if (dias === 0) dias = 7;
  return aISO(sumarDias(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()), dias));
}

// ---- almacenamiento ----
export function reservasSemilla(hoy: Date): Reserva[] {
  const jueves = deISO(proximoJueves(hoy));
  const lista: Reserva[] = [];
  const add = (sala: SalaId, dias: number, bloque: Bloque, nombre: string, nota: string, musicos?: number) => {
    const fecha = aISO(sumarDias(jueves, dias));
    const slug = nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.|\.$/g, '');
    const r: Reserva = {
      id: `semilla-${sala}-${fecha}-${bloque}`,
      sala,
      fecha,
      bloque,
      nombre,
      correo: `${slug}@example.com`,
      nota,
    };
    if (sala === 'sala-banda') r.musicos = musicos ?? 4;
    lista.push(r);
  };
  // Jueves: día completo (3 salas x 4 bloques)
  const dia: [string, string][] = [
    ['Son istmeño', 'sobre marimba'],
    ['Los Alebrijes', 'ensayo general'],
    ['Trío Jarocho', 'traen arpa'],
    ['Cumbia del Valle', 'grabación de demo'],
  ];
  const bloques: Bloque[] = ['10', '12', '16', '18'];
  const salas: SalaId[] = ['sala-banda', 'cabina-voz', 'control-mezcla'];
  salas.forEach((sala, i) =>
    bloques.forEach((b, j) => {
      const [n, nota] = dia[(i + j) % 4];
      add(sala, 0, b, i === 0 && j === 2 ? 'Son istmeño' : `${n}${i ? ' ' + (i + 1) : ''}`, nota, 5);
    }),
  );
  // Días sueltos
  add('cabina-voz', -3, '10', 'Lupita Ramírez', 'voz para single');
  add('sala-banda', -3, '18', 'Banda Tehuana', 'ensayo con vientos', 7);
  add('control-mezcla', -2, '12', 'Mario Cruz', 'mezcla de EP');
  add('cabina-voz', -1, '16', 'Coro Mixteco', 'locución y coros');
  add('sala-banda', 2, '10', 'Marimba Chiapaneca', 'ensayo', 6);
  add('control-mezcla', 2, '16', 'Ana Villalobos', 'masterización');
  add('cabina-voz', 5, '12', 'Rosa Montes', 'podcast');
  add('sala-banda', 5, '16', 'Son de Madera', 'cuarteto', 4);
  add('control-mezcla', 6, '10', 'Diego Salas', 'mezcla de cumbia');
  add('cabina-voz', 7, '18', 'Pablo Ortega', 'locución');
  return lista;
}

const esReserva = (r: unknown): r is Reserva => {
  if (!r || typeof r !== 'object') return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === 'string' &&
    SALAS.some((s) => s.id === x.sala) &&
    typeof x.fecha === 'string' &&
    BLOQUES.includes(x.bloque as Bloque) &&
    typeof x.nombre === 'string' &&
    typeof x.correo === 'string'
  );
};

function leerLista(): Reserva[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return [];
  try {
    const data: unknown = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(esReserva) : [];
  } catch {
    return [];
  }
}

/** Carga las reservas; si la clave no existe, la crea con las reservas de ejemplo. */
export function cargarReservas(hoy: Date): Reserva[] {
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === null) {
      const semilla = reservasSemilla(hoy);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(semilla));
      } catch {
        // sin almacenamiento: la semilla vive solo en memoria
      }
      return semilla;
    }
    return leerLista();
  } catch {
    return [];
  }
}

export function nuevoId(): string {
  const c = globalThis.crypto;
  return c && typeof c.randomUUID === 'function'
    ? c.randomUUID()
    : `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export type ResultadoGuardar = { ok: true; lista: Reserva[] } | { ok: false; motivo: 'duplicada' };

/** Guarda en localStorage (puede lanzar si el almacenamiento falla). Rechaza sala+fecha+bloque repetidos. */
export function guardarReserva(r: Reserva): ResultadoGuardar {
  const lista = leerLista();
  if (lista.some((x) => x.sala === r.sala && x.fecha === r.fecha && x.bloque === r.bloque)) {
    return { ok: false, motivo: 'duplicada' };
  }
  const nueva = [...lista, r];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva));
  return { ok: true, lista: nueva };
}

/** Borra todas las reservas (todas las salas) cuyas fechas están en `fechas`. Puede lanzar. */
export function liberarFechas(fechas: string[]): { lista: Reserva[]; borradas: number } {
  const lista = leerLista();
  const resto = lista.filter((r) => !fechas.includes(r.fecha));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resto));
  return { lista: resto, borradas: lista.length - resto.length };
}

export const normalizarCorreo = (c: string) => c.replace(/\s+/g, '').toLowerCase();
export const correoValido = (c: string) => /^[^\s@]+@example\.com$/.test(c);

// ---- .ics ----
const escapar = (t: string) =>
  t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

function plegar(linea: string): string {
  const partes: string[] = [];
  let resto = linea;
  while (resto.length > 70) {
    partes.push(resto.slice(0, 70));
    resto = ` ${resto.slice(70)}`;
  }
  partes.push(resto);
  return partes.join('\r\n');
}

export function construirIcs(r: Reserva, ahora: Date = new Date()): string {
  const sala = salaPorId(r.sala);
  const f = r.fecha.replace(/-/g, '');
  const stamp = `${ahora.getUTCFullYear()}${pad(ahora.getUTCMonth() + 1)}${pad(ahora.getUTCDate())}T${pad(ahora.getUTCHours())}${pad(ahora.getUTCMinutes())}${pad(ahora.getUTCSeconds())}Z`;
  const descripcion = [
    `Reserva a nombre de ${r.nombre} (${r.correo}).`,
    r.musicos ? `Músicos: ${r.musicos}.` : '',
    r.nota ? `Nota: ${r.nota}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Estudio Cenzontle Sonoro//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${r.id}@cenzontle-sonoro`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${f}T${r.bloque}0000`,
    'DURATION:PT2H',
    `SUMMARY:${escapar(`${sala.nombre} · Estudio Cenzontle Sonoro`)}`,
    `DESCRIPTION:${escapar(descripcion)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lineas.map(plegar).join('\r\n')}\r\n`;
}

export function descargarIcs(r: Reserva) {
  const blob = new Blob([construirIcs(r)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cenzontle-${r.sala}-${r.fecha}-${r.bloque}h.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
