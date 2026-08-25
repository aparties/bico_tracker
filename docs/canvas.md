# Project Canvas — Smart Task & Voice Tracker

## 1. Project Overview & Vision
**Smart Task Tracker** es una plataforma moderna de gestión y seguimiento de tareas diseñada para optimizar los flujos de trabajo personales y profesionales. Su propuesta de valor principal radica en la captura ágil e inteligente de tareas mediante lenguaje natural (texto y voz), extrayendo automáticamente parámetros temporales críticos (fecha de inicio, fecha de presentación/límite y fecha de término) y organizándolas en tableros interactivos (Kanban y Calendario dinámico).

---

## 2. Target Architecture & Tech Stack

| Layer | Technology | Key Role / Rationale |
| :--- | :--- | :--- |
| **Framework / Core** | Next.js 16 (App Router) | Server Components, Server Actions, Serverless API Routes |
| **Language** | TypeScript | Tipado estricto de extremo a extremo (end-to-end type safety) |
| **Database** | Neon (Serverless PostgreSQL) | Escalabilidad automática, conexión optimizada con connection pooling |
| **ORM / Query Layer** | Prisma Next (Prisma 8) | Migraciones ligeras, esquemas rápidos en `contract.prisma` |
| **Styling & UI** | Tailwind CSS v4 + Lucide React | Interfaz moderna, accesible, responsive y de alto rendimiento |
| **Voice / Speech** | Web Speech API | Transcripción de voz en tiempo real con instanciación bajo demanda en móviles |
| **NLP & AI Engine** | Vercel AI SDK / Google Gemini API | Extracción de fechas, prioridades y estados usando `gemini-3.6-flash` |
| **State Management** | TanStack Query | Sincronización y caché de datos asíncronos en cliente |

---

## 3. Core Functional Modules

### A. NLP Voice & Text Ingestion Engine
- **Voice Ingestion:** Captura de voz directa en el navegador mediante `webkitSpeechRecognition` / `SpeechRecognition` con soporte móvil e instanciación en caliente para compatibilidad con iOS/Safari.
- **Entity Extraction Pipeline:** Procesamiento por LLM con esquema estricto (Zod Schema) para convertir frases de lenguaje natural en objetos estructurados con `title`, `description`, `startDate`, `dueDate`, `endDate` y `priority` mediante la API de Google Gemini (`gemini-3.6-flash`).

### B. Board & Kanban Management
- **Columnas de Flujo:**
  1. `PENDING` (Pendiente): Tareas registradas en cola.
  2. `IN_PROGRESS` (En Curso): Tareas activas.
  3. `COMPLETED` (Terminado): Tareas concluidas con registro automático de la fecha de cierre.
- **Vistas Alternativas:** 
  - **Tablero Kanban**: Columnas con arrastre y cambio dinámico de estado.
  - **Vista Calendario**: Planificación detallada en vistas **Diaria** (agenda), **Mensual** (calendario cuadrícula) y **Anual** (mapa de calor por prioridades).

### C. Historial de Cambios (Audit Logs)
- Registro automático en `TaskActivityLog` de cada evento significativo sobre una tarea:
  - `"CREATE"`: Creación de la tarea (manualmente o mediante procesamiento de voz).
  - `"STATUS_CHANGE"`: Modificación de columna o estado en el Kanban.
  - `"DATE_UPDATE"`: Cambios en los parámetros temporales de inicio o límites.
- Visualización de la trazabilidad completa en una línea de tiempo dentro del modal de detalle de cada tarea.

---

## 4. User Journey & Workflow

```
[Usuario habla / escribe] 
        │
        ▼
[Web Speech API (Instanciada On-Demand)]
        │
        ▼
[Server Action: /api/tasks/parse] ──► [Gemini 3.6 Flash Parser]
        │                                      │
        ▼                                      ▼
[Preview Modal / Auto-commit] ◄── [JSON estructurado: fechas + estado]
        │
        ▼
[Neon PostgreSQL via Prisma Next]
        │
        ▼
[Revalidación QueryClient & Render en Kanban/Calendario]
```

---

## 5. Non-Functional Requirements & Security
- **Performance:** Tiempo de respuesta $< 200\text{ ms}$ en lecturas de tablero; latencia $< 1.2\text{ s}$ en extracción con Gemini.
- **Connection Pooling:** Uso de cadenas de conexión optimizadas con Neon connection pooling para serverless.
- **Resilience:** Fallback de base de datos a nivel de compilación para evitar caídas durante los procesos de construcción en Vercel.
