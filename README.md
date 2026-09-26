# Portafolio — Hedmon Fabian Cervantes Gómez

Diseño industrial. Producto y servicio desde la intersección entre el diseño y
los negocios. Guadalajara, México.

Sitio en dos idiomas (español principal, inglés alternativo), sin framework ni
proceso de compilación: HTML, CSS y JavaScript escritos a mano.

## Estructura

```
SITE/                 lo único que se publica
  index.html          la página entera, incluido el diccionario ES/EN
  site.css            la única hoja de estilos
  print.css           la misma página, compuesta en hojas A4 horizontales
  img/                imágenes optimizadas para web
  video/              portada, hydrofoil, el corto y sus tres fragmentos
tools/pdf.mjs         imprime el sitio a PDF con Chromium
tools/og.mjs          exporta la tarjeta de 1200x630 para compartir enlaces
.github/workflows/    el despliegue a GitHub Pages
MOTION.md             análisis del video de referencia y qué se tomó de él
```

Las carpetas de material original —renders, fotografía, documentos de cada
proyecto— viven junto a esta pero **no** están en el repositorio: son ~140 MB y
el sitio ya lleva sus propias versiones optimizadas. Ver `.gitignore`.

## Verlo en local

Cualquier servidor estático sirve. Sin uno, el navegador bloquea la carga de
`site.css` y de los videos por CORS al abrir el archivo directamente.

```bash
py -m http.server 5501 --directory SITE
```

Y abrir <http://localhost:5501>.

## Publicar

Cada `push` a `main` publica, en los dos lados y sin más pasos.

```bash
git add -A && git commit -m "…" && git push
```

La dirección oficial es **<https://hedmoncervantes.netlify.app>**. Es la que la
propia página imprime en la ficha "Este sitio", la que va en el CV y la que
nombra el `canonical` del `index.html`.

Hay dos hosts y sirven la misma carpeta:

| | quién lo publica | para qué |
|---|---|---|
| `hedmoncervantes.netlify.app` | `netlify.toml` (`publish = "SITE"`, sin build) | la casa |
| `hofc1461.github.io` | `.github/workflows/deploy.yml` | respaldo, y la dirección vieja sigue viva |

Dos copias idénticas en línea competirían en los buscadores. Lo que lo evita es
el `<link rel="canonical">`: nombra la dirección de Netlify, así que el
rastreador llegue por donde llegue acredita ésa. Un encabezado `X-Robots-Tag`
no serviría para las dos —Pages no sabe mandar encabezados— y la etiqueta sí,
porque viaja dentro del archivo.

Para que Pages siga funcionando, en **Settings → Pages** el *Source* debe estar
en **GitHub Actions** (no en "Deploy from a branch").

## Exportar el PDF

El PDF que se manda por correo sale del sitio, no de un archivo aparte: el
script sirve `SITE/`, lo abre en Chromium y lo imprime con `print.css`. Salen
dos, español e inglés, en `dist/` —que no entra al repositorio.

```bash
npm i -D playwright && npx playwright install chromium
node tools/pdf.mjs                 # ambos idiomas
node tools/pdf.mjs --lang es       # sólo uno
node tools/pdf.mjs --only cv       # versión corta: perfil y trayectoria
node tools/pdf.mjs --light         # el mismo documento, por debajo de 2 MB
```

`--only cv` saca el currículum solo, dos hojas, para las vacantes que piden CV
y no portafolio. Tampoco es una segunda maqueta: son las mismas dos hojas del
documento largo, impresas sin las dieciséis restantes. `print.css` hace el
corte bajo `html[data-print="cv"]`; ahí mismo se recompone lo poco que cambia
—el bloque de contacto que solo existe en ese archivo, la escala de la hoja de
trayectoria, la foto que se estira hasta donde llega el texto de al lado—.
Las medidas están resueltas contra el inglés, que corre unos 24 px más largo
que el español.

### `--light`, para adjuntarlo

LinkedIn no acepta adjuntos de más de 2 MB y el documento completo pesa 3.9.
`--light` saca el mismo documento en 1.8, con el sufijo `-web` en el nombre, y
**no toca la composición**: la página se sirve desde una copia desechable de
`SITE/` cuyas fotografías vienen re-codificadas, así que el layout, la
paginación y la tipografía son los mismos. Necesita `ffmpeg` en el PATH o en
`$FFMPEG`.

De dónde salen los 2 MB que sobran, medido y en orden:

1. **El retrato, 1.27 MB de los 3.9 —un tercio del archivo por una sola foto.**
   `.portrait` lleva `filter: grayscale()`, y un filtro CSS obliga a Chromium a
   rasterizar la imagen él mismo y a incrustar el resultado **sin pérdida**, en
   PNG, al doble del tamaño de maqueta: 1812×1550 px de una foto que en la hoja
   mide 906. Así que el gris se hornea en el archivo con ffmpeg y a `.portrait`
   se le quita el filtro: la misma foto viaja como un JPEG de 150 KB. Ése es el
   motivo por el que existe este modo.
2. **Los JPEG se recortan a 1600 px de ancho y se recomprimen** a `-q:v 5`. La
   lámina más ancha del documento se imprime a 1123 px, así que el tope no se
   ve. Los íconos no se tocan: son máscaras PNG con canal alfa, pesan unos
   kilobytes, y una pasada con pérdida sobre un alfa es cómo una máscara se
   vuelve lodo.
3. **`deviceScaleFactor` baja a 1**, que es puro seguro: lo único que compraba
   el 2× era el rasterizado sin pérdida que este modo existe para evitar.

Resultado: 3.48 MB de imágenes incrustadas bajan a 1.40, y el archivo de 3.94 a
1.78. La copia desechable se borra al terminar.

Cualquiera puede sacar el suyo desde el navegador con Ctrl+P: `print.css` está
enlazado en la página con `media="print"`, así que la vista previa de impresión
es el mismo documento. Lo que el script agrega es el estado en que la página
tiene que estar antes de imprimir —cada foto descargada en su tamaño original,
cada revelado resuelto— porque nada de eso ocurre en una página que nunca se
desplazó.

## La tarjeta del enlace

Cuando la dirección se pega en LinkedIn, WhatsApp, Slack o un correo, el
rastreador lee las etiquetas Open Graph del `<head>` y dibuja una tarjeta. Sin
ellas queda un rectángulo gris con una línea de texto —y eso es lo primero que
ve un reclutador, antes de que la página alcance a cargar.

La imagen es la portada del propio sitio, exportada al 1200×630 al que se corta
la tarjeta:

```bash
node tools/og.mjs
```

Sale en `SITE/img/og/share.jpg` y **sí** entra al repositorio: es parte de la
página, no del PDF. El script fuerza dos cosas que la pantalla no necesita —el
póster del video como fondo, porque una tarjeta sólo puede ser un cuadro fijo,
y la firma bajo el título, que en pantalla la lleva el encabezado.

Las direcciones de esas etiquetas van completas —un rastreador no resuelve
rutas relativas—, así que **si el sitio cambia de dirección hay que cambiarlas
a mano**. Son ocho en total: tres en el `<head>` (`canonical`, `og:url`,
`og:image`) y cinco en el cuerpo (el `href` y el texto visible del bloque "Este
sitio", los mismos dos de la fila PORTAFOLIO de la hoja de contacto, y la línea
de contacto del CV). Búscalas con:

```bash
grep -rn "hedmoncervantes.netlify.app" SITE/
```

Y después de cambiarlas faltan dos cosas que no están en el repositorio:
regenerar los PDFs, porque el CV imprime la dirección, y **volver a pegar el
enlace en LinkedIn** para que regenere la tarjeta, que la guarda en caché.

## Decisiones que conviene conocer antes de tocar nada

- **Tipografía.** `--font-display` es Inter Tight, una grotesca. El sitio nació
  en Jost/Futura —geométrica— y se cambió a propósito: las referencias son Neue
  Haas Grotesk. No hay ajuste que convierta una en otra.
- **Scroll nativo.** Hubo un manejador de rueda que avanzaba de bloque en bloque
  y se quitó; el comentario en `index.html` explica por qué. No reconstruirlo.
- **Sin degradados sobre la portada.** El velo y la barra del encabezado se
  quitaron los dos. La página está hecha de filetes y cortes duros.
- **Las palabras de cartel se miden, no se escalan.** `[data-fit]` resuelve el
  cuerpo desde el ancho a llenar, y las alinea por su tinta, no por su caja.
- **Las fotos se sirven en varios tamaños.** Cada `<img>` de proyecto lleva
  `srcset` con una variante de 768 y otra de 1200 px, y un `sizes` que dice qué
  fracción de la pantalla ocupa *esa* foto (una sola en su fila llena la medida,
  dos se la reparten, tres la parten en tercios). En el teléfono eso baja el mapa
  de bits de 103 MB a 28 MB. Si agregas una foto, generá sus variantes y escribí
  su `sizes`: sin eso el celular vuelve a decodificar el original completo.
- **`ScrollTrigger.refresh()` no se llama en pleno scroll.** Estaba colgado del
  `load` de cada imagen, y esas imágenes llegan justo mientras el dedo se mueve;
  cada llamada es un layout sincrónico de todo el documento. Ahora espera a que
  el scroll se quede quieto y además compara la altura antes de re-medir: como
  toda foto vive en una caja con `aspect-ratio` declarado, cargar una imagen no
  mueve nada y la medición sobra. Lo que sí cambia de altura —tipografías,
  rotación, el cambio de idioma— pasa `true` y se salta esa comparación.
- **El papel impreso es parte del diseño.** `print.css` no es un respaldo: la
  hoja es horizontal porque es la forma en que está dibujada la composición, y
  sin márgenes de página porque el papel es color hueso y ningún motor de
  impresión pinta el margen. El aire contra el borde lo carga cada bloque que
  puede empezar una hoja, no la página.
- **Las hojas de proyecto se componen, no se vierten.** Un scroll tiene una
  columna y no tiene final; una hoja tiene dos dimensiones y un piso duro.
  Vertida tal cual, la misma columna daba una página de puro texto, luego una
  de una sola foto, luego una a medio llenar porque la siguiente fila de
  láminas no cabía por un centímetro. Así que en papel cada artículo es una
  rejilla de doce columnas —láminas a la izquierda, lo que se lee en una
  columna más angosta a la derecha— y los envoltorios que existen para centrar
  un scroll (`.wrap`, `.band`, `.phead__meta`, `.gal`) se quitan de en medio
  con `display:contents`. Las tres composiciones están escritas a mano, una por
  proyecto: no hay regla que acomode seis, cuatro y tres fotografías de formas
  distintas en páginas iguales.
- **Las portadas de proyecto son una suma exacta.** La lámina sale por tres
  cantos del papel, y para eso la hoja tiene que cerrar al pixel: el cabezal
  lleva altura fija, la palabra de cartel tamaño fijo dentro de él, y la lámina
  toma `210mm` menos el cabezal. Por eso aquí la palabra no se mide contra el
  ancho como en pantalla: a 170px la más larga —MUNCHSPOT— cae justo dentro de
  la caja, y una palabra que se sale la paga toda la edición (ver abajo).
- **Tres cosas que Chromium hace distinto al imprimir.** (1) Contesta las
  *media queries* de ancho contra la hoja medida en **puntos** —842 en A4
  horizontal— mientras arma la página en píxeles CSS, donde esa misma hoja mide
  1123: por eso las reglas de dos columnas del sitio, todas por encima de 860,
  se repiten en `print.css` sin consulta. (2) Si algo se sale del ancho de la
  hoja, **encoge el documento entero** para que quepa: una palabra de cartel 4%
  demasiado ancha estaba achicando cada hoja un 2% y despegando las láminas del
  canto al que están cortadas. (3) Un marco con proporción declarada al que se
  le fija la altura resuelve su **ancho** desde la proporción: si no se le dice
  `width`, la lámina se angosta sola y la fila deja de llegar a su propio borde.
- **Deja aire al pie de cada hoja.** El texto se mide en un motor y se compone
  en otro, y se mueve un renglón; una hoja calculada al ras se parte en dos. Lo
  que fija la altura de una fila conviene que sea una imagen —un número en este
  archivo— y no una columna de texto. Y un `break-before: page` forzado justo
  después de contenido que ya llega al canto produce una hoja en blanco: donde
  pase, se quita el forzado y se deja que la página rompa sola.
- **La dirección tiene que sobrevivir a un extractor de texto.** Este PDF lo
  leen tanto personas como filtros automáticos, y las etiquetas de este
  documento llevan `letter-spacing`, que sale de un extractor como
  `C O R R E O`. Por eso la dirección está dos veces y ninguna en mayúsculas
  espaciadas: en la ficha "Este sitio" y como tercera fila de la hoja de
  contacto, en minúsculas y con el mismo cuerpo que el correo. Además las dos
  son `<a href>`, así que el PDF lleva la URL completa también como anotación
  de enlace, que es lo que lee un parser sin mirar el texto. Si algo de esto
  cambia, verificar con `page.get_text()` y `page.get_links()`, no a ojo.
- **Idioma.** El interruptor cambia el `lang` del documento. Texto nuevo necesita
  su entrada en el diccionario de `index.html`; abrir la página en
  `#i18n-audit` lista lo que no está cubierto.

## Créditos

Proyectos desarrollados con los colaboradores acreditados en cada ficha.
Favor de no copiar los diseños mostrados.
