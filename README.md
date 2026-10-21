# Encuestador público

Web pública para responder las encuestas creadas desde la aplicación
**Encuestador** de Espacio.

La autoría, publicación, resultados y exportación CSV viven en
`tecnocoopcl/espacio`. Esta web solo carga una encuesta desde
`tecnocoopcl/api`, valida los campos y envía la respuesta para que la API la
deposite en el Solid Pod del creador.

Una encuesta se abre como `?encuesta=identificador`. Si el parámetro falta, la
portada permite escribirlo manualmente.

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Por defecto usa `https://status-tc.aebn.cl`. Para probar la API local:

```bash
VITE_API_URL=http://localhost:8080 npm run dev
```

## Verificación y publicación

```bash
npm test
npm run build
```

El workflow de GitHub Pages compila y publica `dist/` al integrar cambios en
`main`.
