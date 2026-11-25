# Encuestador público

Web pública para responder las encuestas creadas desde la aplicación
**Encuestador** de Espacio.

La autoría, publicación, resultados y exportación CSV viven en
`tecnocoopcl/espacio`. Esta web solo carga una encuesta desde
`tecnocoopcl/api`, valida los campos y envía la respuesta para que la API la
deposite en el Solid Pod del creador.

Una encuesta se abre como `?encuesta=identificador`. Si el parámetro falta, la
portada permite escribirlo manualmente.

## Solo para socios

Toda encuesta se responde con sesión: la web pide iniciar sesión Solid con el
proveedor de la cooperativa
(`https://pods.tecnocooperativa.cl`, o `VITE_SOLID_PROVEEDOR`) antes de mostrar
el formulario, y envía la respuesta con `fetch` de
`@inrupt/solid-client-authn-browser`, que agrega el token y la prueba DPoP. Quién
puede responder lo decide la API (`members`: cualquier socio; `list`: solo los
invitados); la web solo consigue la sesión. Con `anonymous: true` se avisa que
la respuesta no guarda el WebID.

La API deja la respuesta en el Pod del creador con la identidad propia del
encuestador (ADR-015 de medio), y la carpeta de respuestas solo le da `Append`
a ese WebID: ya no está abierta a cualquiera.

## Desarrollo

Requiere Node.js 20 o superior.

```bash
npm install
npm run dev
```

Por defecto usa `https://api.tecnocooperativa.cl`. Para probar la API local:

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
