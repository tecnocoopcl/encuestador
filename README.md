# Encuestador

Mini-app para construir encuestas modulares, validar respuestas, revisar los
resultados en una tabla y exportarlos como CSV.

## Alcance de la versión 0.1

- Crear, editar, duplicar, ordenar y eliminar preguntas.
- Respuestas de texto breve, texto largo, número, fecha, alternativa única y
  alternativas múltiples.
- Preguntas obligatorias y validación con mensajes junto al campo incorrecto.
- Vista previa y formulario de respuesta.
- Tabla de respuestas y exportación CSV compatible con Excel.
- Guardado en `Aplicaciones/encuestador/encuestador.json` cuando corre dentro de
  Espacio; almacenamiento local del navegador cuando se abre como web suelta.
- Publicación estática mediante GitHub Pages.

La recepción pública de respuestas de otros socios no forma parte de esta
versión: requiere acordar con `tecno-cooperativa-backend` un buzón autenticado.
La interfaz y el modelo de datos quedan separados del almacenamiento para poder
añadirlo sin rehacer el constructor.

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

La aplicación queda en <http://localhost:5174>.

## Probar dentro de Espacio

En la raíz del repositorio `espacio`, crear `.espacio-dev.json`:

```json
{ "encuestador": "http://localhost:5174" }
```

Copiar `docs/espacio-manifest.json` a
`espacio/packages/catalog/apps/encuestador.json`, copiar
`public/encuestador.svg` a los iconos del shell y ejecutar ambos proyectos. El
origen del manifiesto debe ajustarse cuando exista el dominio definitivo.

## Verificación

```bash
npm test
npm run build
```
