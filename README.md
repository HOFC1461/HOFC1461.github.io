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
  img/                imágenes optimizadas para web
  video/              portada y hydrofoil
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
- **Idioma.** El interruptor cambia el `lang` del documento. Texto nuevo necesita
  su entrada en el diccionario de `index.html`; abrir la página en
  `#i18n-audit` lista lo que no está cubierto.

## Créditos

Proyectos desarrollados con los colaboradores acreditados en cada ficha.
Favor de no copiar los diseños mostrados.
