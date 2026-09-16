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
  print.css           la misma página, paginada en A4 horizontal
  img/                imágenes optimizadas para web
  video/              portada y hydrofoil
tools/pdf.mjs         imprime el sitio a PDF con Chromium
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

Cada `push` a `main` publica. No hay más pasos.

```bash
git add -A && git commit -m "…" && git push
```

En **Settings → Pages**, *Source* debe estar en **GitHub Actions** (no en
"Deploy from a branch").

## Exportar el PDF

El PDF que se manda por correo sale del sitio, no de un archivo aparte: el
script sirve `SITE/`, lo abre en Chromium y lo imprime con `print.css`. Salen
dos, español e inglés, en `dist/` —que no entra al repositorio.

```bash
npm i -D playwright && npx playwright install chromium
node tools/pdf.mjs                 # ambos idiomas
node tools/pdf.mjs --lang es       # sólo uno
```

Cualquiera puede sacar el suyo desde el navegador con Ctrl+P: `print.css` está
enlazado en la página con `media="print"`, así que la vista previa de impresión
es el mismo documento. Lo que el script agrega es el estado en que la página
tiene que estar antes de imprimir —cada foto descargada en su tamaño original,
cada revelado resuelto— porque nada de eso ocurre en una página que nunca se
desplazó.

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
  impresión pinta el margen. Dos cosas que conviene saber si se toca: Chromium
  resuelve las *media queries* de impresión contra la hoja medida en **puntos**
  —842 en A4 horizontal— mientras arma la página en píxeles CSS, donde esa
  misma hoja mide 1123; por eso las reglas de dos columnas del sitio, todas por
  encima de 860, se repiten ahí sin consulta. Y el aire contra el borde del
  papel lo carga cada bloque que puede empezar una hoja, no la página.
- **Idioma.** El interruptor cambia el `lang` del documento. Texto nuevo necesita
  su entrada en el diccionario de `index.html`; abrir la página en
  `#i18n-audit` lista lo que no está cubierto.

## Créditos

Proyectos desarrollados con los colaboradores acreditados en cada ficha.
Favor de no copiar los diseños mostrados.
