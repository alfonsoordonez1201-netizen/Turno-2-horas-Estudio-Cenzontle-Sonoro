# Estudio Cenzontle Sonoro — reservas de sala

> Nota: este proyecto se comparte con partners@kodarvia.com.

Una sola página (`/`) para reservar las tres salas de un estudio de grabación independiente. No hay base de datos,
login, carrito ni cuentas: todo vive en el `localStorage` del navegador.

## Qué es

- Catálogo fijo de salas:
  | Sala | Clave | Aforo | Precio |
  | --- | --- | --- | --- |
  | Cabina voz | `cabina-voz` | hasta 2 músicos | $900 MXN / 2h |
  | Sala banda | `sala-banda` | hasta 8 músicos | $1800 MXN / 2h |
  | Control mezcla | `control-mezcla` | hasta 3 músicos | $1400 MXN / 2h |
- Grilla semanal de lunes a sábado con cuatro bloques de 2 horas: 10:00, 12:00, 16:00 y 18:00. Son 6 × 4 = 24
  bloques por sala y 72 en total.
- Estética de consola analógica en penumbra: fondo de cabina oscura, medidores VU encendidos para marcar «Ocupado»,
  etiquetas de cinta y rosa mexicano brillante.

## Cómo se usa

1. Elegí la sala con las tres pestañas (se ve descripción, aforo y precio «MXN / 2h»).
2. Mirá la semana. Se abre en la semana actual (de lunes a sábado; si hoy es domingo, la que viene). Con
   «Semana anterior», «Semana siguiente» y «Esta semana» te movés por el calendario.
3. Cada celda muestra sala, fecha y hora, y dice **Libre** (botón) u **Ocupado** (medidor VU encendido, deshabilitado,
   con `aria-disabled`). Un día sin nada libre muestra «Sin bloques libres».
4. Tocá un bloque libre: se abre el formulario con Nombre, Correo (tiene que terminar en `@example.com`), Nota
   (opcional) y, solo en Sala banda, «Cantidad de músicos» (obligatoria, de 1 a 8).
5. «Confirmar reserva» guarda primero en `localStorage`; si guarda bien, muestra el mensaje de éxito y baja un `.ics`.
   Si guardar falla, el formulario conserva lo escrito y muestra el error.
6. «Liberar la semana» (con confirmación `window.confirm`) borra todas las reservas de la semana mostrada, de las
   tres salas: los 72 bloques quedan libres.

## Modelo de datos

Cada reserva es un objeto dentro de un arreglo JSON:

| Campo | Tipo | Detalle |
| --- | --- | --- |
| `id` | string | `crypto.randomUUID()` (la semilla usa un id fijo) |
| `sala` | `'cabina-voz' \| 'sala-banda' \| 'control-mezcla'` | |
| `fecha` | string | `YYYY-MM-DD`, fecha local |
| `bloque` | `'10' \| '12' \| '16' \| '18'` | hora de inicio |
| `nombre` | string | |
| `correo` | string | normalizado: minúsculas y sin espacios; termina en `@example.com` |
| `nota` | string | opcional (puede ser vacía) |
| `musicos` | number | solo Sala banda (1–8) |

Unicidad: no puede haber dos reservas con la misma `sala` + `fecha` + `bloque`; un duplicado se rechaza con un
mensaje.

## localStorage

- Clave propia: `cenzontle-sonoro:reservas:v1`.
- Se lee en un `useEffect` (después de hidratar) para evitar diferencias entre servidor y navegador.
- Los datos persisten al recargar.

## Semilla

Solo si la clave **no existe**, se crea con reservas de ejemplo: el próximo jueves (estrictamente posterior a hoy)
queda **completo** (3 salas x 4 bloques = 12 reservas, incluida «Son istmeño», Sala banda, 16:00, 5 músicos, «sobre marimba»)
y hay 10 reservas sueltas en otros días, entre 3 días antes y 7 días después de ese jueves. Los correos son
`<nombre>@example.com` y los ids `semilla-<sala>-<fecha>-<bloque>`. Si borrás reservas o liberás la semana, no se vuelve a
sembrar (la clave ya existe). Parte de los ejemplos caen en la semana siguiente: se llega con «Semana siguiente».

## Funcionalidades simuladas

- **Correos:** no se envía ninguno. El campo «Correo» solo se valida (`@example.com`) y se guarda en el navegador.
  La «confirmación» es el mensaje de éxito en pantalla más el archivo `.ics`.
- **Pagos:** no hay cobro. El precio «MXN / 2h» es informativo; no existe carrito ni pasarela.
- **WhatsApp y otros avisos:** no existen; no se manda ninguna notificación.
- **Cuentas y base de datos:** no hay; las reservas solo existen en el navegador donde se hicieron (no se comparten
  entre dispositivos).

## Datos de ejemplo y cómo reiniciarlos

La semilla (ver arriba) es una reserva de «Son istmeño». Para volver al estado inicial:

1. Abrí las herramientas del navegador (F12) → Application/Almacenamiento → Local Storage.
2. Borrá la clave `cenzontle-sonoro:reservas:v1` (o en la consola: `localStorage.removeItem('cenzontle-sonoro:reservas:v1')`).
3. Recargá la página: se vuelve a crear la semilla.

## Archivo .ics

Después de guardar se descarga solo `cenzontle-<sala>-<fecha>-<hora>h.ics`:

- `VCALENDAR` con un `VEVENT`, fines de línea CRLF.
- `UID`, `DTSTAMP` (UTC) y `DTSTART` en hora local flotante (`YYYYMMDDTHH0000`, sin zona).
- `DURATION:PT2H` (2 horas) y `SUMMARY` con el nombre de la sala.
- El botón «Bajar el .ics de nuevo» aparece en el mensaje de éxito.

## Criterios de aceptación

- Home `/` con nombre «Estudio Cenzontle Sonoro», `lang="es"`, textos en español rioplatense.
- Tres salas con descripción, aforo y precio «MXN / 2h»; selector de sala.
- 24 celdas por sala (6 días × 4 bloques), 72 en total; «Libre» clickable y «Ocupado» deshabilitado.
- «Sin bloques libres» en un día completo.
- Formulario con validaciones (correo `@example.com`, músicos 1–8 solo en Sala banda) y duplicados rechazados.
- Guarda en localStorage antes de mostrar éxito; error con datos conservados si falla.
- Descarga automática del `.ics` correcto.
- Semilla única, persistencia al recargar, navegación de semanas.
- «Liberar la semana» con confirmación deja los 72 bloques libres en la semana mostrada.
- Usable desde 360 px de ancho.

## Cómo correrlo

Requiere Node 22 y npm.

1. `npm ci`
2. `npm run dev` y abrí <http://localhost:3100>.

Archivos principales: `src/app/page.tsx`, `src/components/estudio/` (grilla, diálogo y medidor VU) y
`src/lib/reservas.ts` (catálogo, fechas, almacenamiento y `.ics`).
