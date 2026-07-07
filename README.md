# Entrena Certificaciones (TDAH-friendly)

Web app estática de entrenamiento para certificaciones Microsoft (PL-300, AZ-900, AZ-104, AZ-305, AZ-500, AZ-800), diseñada para un usuario con TDAH: sesiones cortas, un item por pantalla, feedback inmediato, repetición espaciada (Leitner) y gamificación sana.

**Demo:** https://diemainthesky.github.io/entrena-certificaciones-tdah/ *(GitHub Pages)*

## Stack

- React 18 + Vite + Tailwind CSS. Sin backend, coste cero.
- Contenido en JSON estáticos (`src/content/`), importados en build.
- Todo el progreso del usuario en `localStorage` (clave `certtrainer.v1`), en un único objeto versionado `{ schemaVersion, ... }`.
- Sin analytics, sin fuentes externas, sin llamadas de red en runtime.

## Requisitos

- Node.js 20+ (probado con Node 22) y npm.

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run test       # tests (Vitest); npm run test -- --run para una sola pasada
npm run build      # build de producción en dist/
npm run preview    # sirve la build localmente
```

## Cómo añadir contenido nuevo

Añadir un examen **no requiere tocar código**:

1. Crea `src/content/<examen>.json` siguiendo este esquema:

```jsonc
{
  "examen": "XX-000",
  "nombre": "Nombre del examen",
  "certificacion": "Nombre de la certificación",
  "estado": "activo",
  "vigencia": { "retirementDate": "2027-01-01" },   // opcional
  "cobertura": "completa | muestra",
  "notaLegal": "…",
  "dominios": [
    {
      "id": "xx000-d1",
      "dominio": "Nombre del dominio",
      "ponderacion": "25-30%",
      "subtemas": ["…"],
      "flashcards": [{ "id": "…", "concepto": "…", "explicacion": "…" }],
      "preguntas": [
        {
          "id": "…",
          "pregunta": "…",
          "opciones": [
            { "texto": "…", "correcta": true, "explicacion": "…" },
            { "texto": "…", "correcta": false, "explicacion": "…" }
          ]
        }
      ],
      "escenarios": [
        { "id": "…", "situacion": "…", "pregunta": "…", "respuestaEsperada": "…", "razonamiento": "…" }
      ]
    }
  ]
}
```

2. Añade una entrada en `src/content/index.json`:

```json
{ "codigo": "XX-000", "archivo": "xx-000.json", "prioridad": 2, "cobertura": "muestra" }
```

En modo desarrollo la app valida el esquema al arrancar y muestra un error claro si un JSON está malformado.

## Despliegue en GitHub Pages

El workflow `.github/workflows/deploy.yml` corre en cada push a `main`: instala, testea, construye y publica `dist/` en Pages.

Activación (una sola vez): **Settings → Pages → Source: GitHub Actions**.

Importante: `vite.config.js` tiene `base: '/entrena-certificaciones-tdah/'`. Si renombras el repo, actualiza ese valor o la web saldrá en blanco.

## Nota de honestidad

Esta app entrena conocimiento y razonamiento; **no reemplaza los labs reales de Azure/Power BI**. El contenido es original, creado para práctica a partir del esqueleto temático público de las guías oficiales; no contiene preguntas reales de examen ni texto de Microsoft.
