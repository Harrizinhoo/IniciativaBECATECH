# PlazaViva — Galería virtual de productos locales

Galería web donde vendedores de plazas y locales publican lo que les sobró del día, y compradores lo encuentran.

## Stack
- **HTML5 + CSS3 + JavaScript puro (ES2020)**: no necesita compilar ni instalar dependencias, así que carga al instante.
- **Liquid glass** hecho con `backdrop-filter`, brillos especulares y manchas de color animadas.
- **Persistencia** con `localStorage`, aislada en el objeto `Store` de `app.js`. Para producción se puede cambiar por Supabase, Firebase o una API REST.
- Las imágenes se comprimen en el navegador (canvas → JPEG de 900 px como máximo).

## Ejecutar
```bash
python -m http.server 5173
# abrir http://localhost:5173
```

## Estructura
- `index.html`: estructura base, fondo, barra superior y modal.
- `styles.css`: colores (púrpura #5B1F63, naranja #E07B39 y grises), tipografía Montserrat y estilo glass.
- `app.js`: rutas por hash, vistas (inicio, panel de vendedor, galería de compradores), formularios y almacenamiento.
- `assets/hero.jpg`: ilustración principal.
