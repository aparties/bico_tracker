# Database Architecture Canvas — Neon PostgreSQL

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE ARCHITECTURE CANVAS                      │
├───────────────────────────────────────────────────┬──────────────────────────┤
│ 1. CORE PURPOSE & DOMAIN                          │ 2. ENGINE & TOPOLOGY     │
│    - Gestor de tareas reactivo con soporte de     │    - Engine: PostgreSQL  │
│      procesamiento NLP/Voz en tiempo real.        │      v16+ (Neon)         │
│    - Alta eficiencia en lecturas para tableros    │    - Mode: Serverless    │
│      Kanban y ordenamiento por fechas críticas.   │      with Auto-Suspend   │
│    - Historial de trazabilidad de auditoría.      │    - Connection Pooling: │
│                                                   │      PgBouncer integrado │
├───────────────────────────────────────────────────┼──────────────────────────┤
│ 3. ACCESS PATTERNS & HOT PATHS                    │ 4. INDEXING STRATEGY     │
│    - Read: `SELECT * FROM tasks WHERE status = ?` │    - `idx_tasks_status`  │
│    - Read: `SELECT * FROM tasks ORDER BY          │      (B-Tree en status)  │
│             due_date ASC`                         │    - `idx_tasks_due_date`│
│    - Read: `SELECT * FROM task_activity_logs      │      (B-Tree en deadline)│
│             WHERE task_id = ?`                    │    - `idx_tasks_created` │
│    - Write: Inserción de logs e histórico.        │      (B-Tree en desc)    │
│    - Update: Cambio rápido de status vía Drag&Drop│    - `idx_logs_task_id`  │
│      o selector con triggers de auditoría.        │      (B-Tree en FK)      │
├───────────────────────────────────────────────────┼──────────────────────────┤
│ 5. SERVERLESS & COLD START MITIGATION             │ 6. BACKUP & RECOVERY     │
│    - Utilización de Neon Connection Pooling       │    - Point-in-Time       │
│      (`?pgbouncer=true`) en `DATABASE_URL`.       │      Recovery (PITR)     │
│    - Singleton PrismaClient para evitar           │    - Neon Instant Branch │
│      agotamiento de sockets en desarrollo.        │      para testing y      │
│    - Fallback seguro de conexión en compilación   │      migraciones staging │
│      (Vercel build-time).                         │                          │
├───────────────────────────────────────────────────┴──────────────────────────┤
│ 7. AI / NLP INTEGRATION PIPELINE                                             │
│    [Entrada de Voz / Texto] ──► [Gemini 3.6 Flash] ──► [Structured JSON]         │
│                                                            │                  │
│                                                            ▼                  │
│                                                    [INSERT INTO tasks]        │
│                                                    - title                    │
│                                                    - start_date (Timestamptz) │
│                                                    - due_date (Timestamptz)   │
│                                                    - end_date (Timestamptz)   │
│                                                    - raw_voice_input          │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Resumen de Configuración Operativa

| Parámetro | Configuración Recomendada |
| :--- | :--- |
| **Provider** | Neon Database (AWS Region us-east-2) |
| **Compute Size** | 0.25 CU (Escalado dinámico a demanda) |
| **SSL Enforcement** | `sslmode=require` obligatorio |
| **Prisma Connection** | Max Connections optimizadas mediante PgBouncer / Serverless Postgres Driver |

## Estructura Física del Esquema (Neon)

### Tabla `tasks`
* `id` (TEXT, PK): Identificador único de tarea.
* `title` (TEXT): Título descriptivo.
* `description` (TEXT, Nullable): Notas o detalles.
* `status` (Enum): Estado (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `ARCHIVED`).
* `priority` (Enum): Criticidad (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
* `start_date` (Timestamptz, Nullable): Fecha de inicio.
* `due_date` (Timestamptz, Nullable): Fecha límite de presentación.
* `end_date` (Timestamptz, Nullable): Fecha de cierre real.
* `raw_voice_input` (TEXT, Nullable): Transcripción original dictada.
* `tags` (TEXT[]): Listado de etiquetas.
* `created_at` (Timestamptz): Marca de tiempo de inserción.
* `updated_at` (Timestamptz): Última actualización temporal.

### Tabla `task_activity_logs`
* `id` (TEXT, PK): Identificador único del log.
* `task_id` (TEXT, FK): Referencia a la tarea asociada.
* `action` (TEXT): Tipo de acción realizada (`CREATE`, `STATUS_CHANGE`, `DATE_UPDATE`, `UPDATE`).
* `old_values` (JSONB, Nullable): Snapshot con los datos previos.
* `new_values` (JSONB, Nullable): Snapshot con los datos modificados.
* `created_at` (Timestamptz): Registro cronológico del evento.
