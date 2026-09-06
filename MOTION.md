# Lenguaje de movimiento — análisis del video de referencia

Origen: `video inspiración/f44b668f788173c2e9daf576e301143d.mp4` (14.5 s, 60 fps, 720×540).
Extraje 29 cuadros a 2 fps y los leí en hojas de contacto. El video es un recorrido
completo por una landing de producto: **mushroom → concept → [banda de imagen] →
preorder → mushroom**.

## Lo que hace el video

1. **Una palabra por sección, a escala de cartel.** Cada bloque se ancla en una sola
   palabra en grotesca pesada, más ancha que la ventana, cortada por el borde. No es un
   título sobre el contenido: *es* el contenido gráfico de la sección.
2. **La palabra queda tapada por el producto.** Los objetos pasan por delante y por
   detrás del texto. Ese entrelazado entre tipografía y fotografía es la firma de la
   pieza — sin él, es solo texto grande.
3. **Profundidad por capas.** Tres o cuatro objetos flotando, cada uno a su propia
   velocidad, los lejanos desenfocados. Da un eje Z que el scroll plano no tiene.
4. **La palabra cruza el encuadre.** Se mueve en vertical a distinta velocidad que la
   página, así que entra por abajo y sale por arriba mientras el bloque se lee.
5. **Entrada: la palabra crece hasta su sitio.** Arranca pequeña y centrada y escala
   hasta el tamaño de cartel.
6. **Copy diminuto, aire enorme.** Una columna de texto pequeña arriba a la izquierda
   contra un campo casi vacío. El contraste de escala es lo que hace legible el cartel.

## Lo que se implementó aquí

| Del video | En el sitio |
| --- | --- |
| Palabra-cartel por sección | `.t-poster` en cada portada de proyecto, resuelta al ancho de la caja por `[data-fit]`, no a un tamaño de escala. Un nombre de 4 letras y uno de 9 tienen el mismo peso óptico. |
| Plato pegado a la palabra | `--poster-cut` se resuelve con las métricas reales de la letra (ascendente, descendente, extensión real de la tinta): el plato para ~0.055 em por debajo del último píxel pintado. **No hay solape** — se probó y quedó descartado. |
| La palabra cruza el encuadre | `data-lift="8"` sobre la palabra: sube un 8 % de su propia altura contra el scroll, en un solo sentido, dentro de un `overflow: clip` con `overflow-clip-margin`. El hueco bajo la palabra solo puede abrirse, nunca cerrarse. |
| Profundidad por capas | `data-para` sobre las siluetas del índice (`.entry__art`) y sobre cada imagen de galería, dentro de su marco fijo. |
| La palabra crece al entrar | `.hero__title.enter` escala de .9 a 1 desde su propia línea base. |
| Copy pequeño, aire enorme | El *lede* y la ficha bajaron debajo de la portada; sobre el plato queda solo el número y la palabra. |

## Lo que se probó y se quitó

- **El plato mordiendo las letras.** Era la firma del video y de tu referencia de
  "GALLERY". Sobre estas portadas se leía como texto cortado, no como composición, así
  que ahora el plato se apoya justo debajo de la tinta. La diferencia entre las dos cosas
  es de unos 30 px a cuerpo 260.
- **Un scroll por sección.** Se construyó y se quitó: un manejador de rueda no distingue
  un gesto nuevo de la inercia del anterior, así que la página pasaba más tiempo
  rechazando entradas que moviéndose, y subir era peor que bajar. El scroll es nativo. Lo
  que hace que la referencia se sienta autoral no es secuestrar la rueda — es la cantidad
  de movimiento atado a la posición del scroll, que sigue entera.
- **El degradado de la portada.** Fuera. El encuadre termina donde termina.

## Lo que NO se trajo, y por qué

- **Objetos flotantes desenfocados sobre la portada.** Requiere recortes del producto
  sobre fondo transparente compuestos en varias capas. Las siluetas que hay
  (`img/sil/`) ya trabajan en el índice; ponerlas también sobre el video de portada
  sería la misma imagen dos veces.
- **La palabra en minúsculas.** El video usa caja baja; el sitio está en versalitas y
  eso es una decisión previa, no un defecto.
- **Contador de precio.** No hay dato equivalente que no fuera inventado.

## Tipografía

Las referencias que mandaste (Tube Chair, marea, Gallery) están las tres en
**Neue Haas Grotesk Display / Helvetica Neue** — grotesca, aperturas cerradas,
tracking muy cerrado. Futura y Jost son la construcción contraria: geométricas,
círculos perfectos, `a` de un piso. No hay ajuste que convierta una en otra.

Neue Haas Grotesk Display es de licencia. Lo más cercano que puede servirse como
webfont es **Inter Tight**, dibujada sobre el mismo esqueleto. Es lo que está puesto:
peso 700 en display (500 no tiene masa de cartel), tracking de −.045 a −.052 em según
el tamaño. Si en algún momento licencias la Neue Haas, el cambio es una línea:
`--font-display` en `site.css`.
