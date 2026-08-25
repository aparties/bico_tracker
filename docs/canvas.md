# Project Canvas — Smart Task & Voice Tracker

## 1. Project Overview & Vision
**Smart Task Tracker** es una plataforma moderna de gestión y seguimiento de tareas diseñada para optimizar los flujos de trabajo personales y profesionales. Su propuesta de valor principal radica en la captura ágil e inteligente de tareas mediante lenguaje natural (texto y voz), extrayendo automáticamente parámetros temporales críticos (fecha de inicio, fecha de presentación/límite y fecha de término) y organizándolas en tableros interactivos (Kanban / Lista).

---

## 2. Target Architecture & Tech Stack

| Layer | Technology | Key Role / Rationale |
| :--- | :--- | :--- |
| **Framework / Core** | Next.js 15+ (App Router) | Server Components, Server Actions, Serverless API Routes |
| **Language** | TypeScript | Tipado estricto de extremo a extremo (end-to-end type safety) |
| **Database** | Neon (Serverless PostgreSQL) | Escalabilidad automática, conexión optimizada con connection pooling |
| **ORM / Query Layer** | Prisma ORM / Drizzle ORM | Migraciones estructuradas, esquemas declarativos y tipado seguro |
| **Styling & UI** | Tailwind CSS + Shadcn UI + Lucide React | Interfaz moderna, accesible, responsive y de alto rendimiento |
| **Voice / Speech** | Web Speech API & Whisper API | Transcripción de voz en tiempo real y soporte multilingüe |
| **NLP & AI Engine** | Vercel AI SDK / OpenAI Structured Outputs | Extracción de entidades temporales, prioridades y resúmenes |
| **State Management** | TanStack Query / Zustand | Sincronización de UI optimista y estado reactivo |

---

## 3. Core Functional Modules

### A. NLP Voice & Text Ingestion Engine
- **Voice Ingestion:** Captura de voz directa en el navegador mediante `webkitSpeechRecognition` / `SpeechRecognition` con fallback a Whisper API.
- **Entity Extraction Pipeline:** Procesamiento por LLM con esquema estricto (JSON Schema) para convertir frases como:
  > *"Presentar el informe de avance de automatización, iniciamos este lunes a las 08:00, fecha límite el 15 y cerramos el 18"*
  en objetos estructurados con `title`, `description`, `startDate`, `dueDate`, `endDate` y `priority`.

### B. Board & Kanban Management
- **Columnas de Flujo:**
  1. `PENDING` (Pendiente): Tareas registradas en cola.
  2. `IN_PROGRESS` (En Curso): Tareas activas con tracking de tiempo.
  3. `COMPLETED` (Terminado): Tareas concluidas con registro histórico de entrega.
- **Vistas Alternativas:** Vista Lista, Vista Calendario y Filtros por fechas límite críticas.

### C. Alert & Timeline Monitoring
- Indicadores visuales de proximidad de fecha límite (`dueDate`).
- Diferenciación clara entre ciclo de desarrollo (`startDate` $\to$ `endDate`) y ventana de entrega (`dueDate`).

---

## 4. User Journey & Workflow

```
[Usuario habla / escribe] 
        │
        ▼
[Web Speech API / Audio Recorder]
        │
        ▼
[Server Action: /api/tasks/parse] ──► [LLM Structured Output]
        │                                      │
        ▼                                      ▼
[Preview Modal / Auto-commit] ◄── [JSON estructurado: fechas + estado]
        │
        ▼
[Neon PostgreSQL via Prisma]
        │
        ▼
[Revalidación Instantánea & Render en Tablero Kanban]
```

---

## 5. Non-Functional Requirements & Security
- **Performance:** Tiempo de respuesta $< 200\text{ ms}$ en lecturas de tablero; latencia $< 1.5\text{ s}$ en extracción con IA.
- **Connection Pooling:** Uso obligatorio de `@neondatabase/serverless` o Prisma Accelerate/PgBouncer para evitar saturación de conexiones en entornos Serverless/Edge.
- **Resilience:** Soporte offline temporal en UI con persistencia en localStorage antes de confirmación en backend.
