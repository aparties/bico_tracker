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
│                                                   │    - Connection Pooling: │
│                                                   │      PgBouncer integrado │
├───────────────────────────────────────────────────┼──────────────────────────┤
│ 3. ACCESS PATTERNS & HOT PATHS                    │ 4. INDEXING STRATEGY     │
│    - Read: `SELECT * FROM tasks WHERE status = ?` │    - `idx_tasks_status`  │
│    - Read: `SELECT * FROM tasks ORDER BY          │      (B-Tree en status)  │
│             due_date ASC`                         │    - `idx_tasks_due_date`│
│    - Write: Inserción directa de tareas parseadas │      (B-Tree en deadline)│
│      por Server Actions.                          │    - `idx_tasks_created` │
│    - Update: Cambio rápido de status vía Drag&Drop│      (B-Tree en desc)    │
├───────────────────────────────────────────────────┼──────────────────────────┤
│ 5. SERVERLESS & COLD START MITIGATION             │ 6. BACKUP & RECOVERY     │
│    - Utilización de Neon Connection Pooling       │    - Point-in-Time       │
│      (`?pgbouncer=true`) en `DATABASE_URL`.       │      Recovery (PITR)     │
│    - Singleton PrismaClient para evitar           │    - Neon Instant Branch │
│      agotamiento de sockets en desarrollo.        │      para testing y      │
│    - Conexiones Directas restringidas a           │      migraciones staging │
│      entornos CLI / Migraciones.                  │                          │
├───────────────────────────────────────────────────┴──────────────────────────┤
│ 7. AI / NLP INTEGRATION PIPELINE                                             │
│    [Entrada de Voz / Texto] ──► [LLM Parser] ──► [Structured JSON]           │
│                                                         │                     │
│                                                         ▼                     │
│                                                 [INSERT INTO tasks]           │
│                                                 - title                       │
│                                                 - start_date (Timestamptz)    │
│                                                 - due_date (Timestamptz)      │
│                                                 - end_date (Timestamptz)      │
│                                                 - raw_voice_input             │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Resumen de Configuración Operativa

| Parámetro | Configuración Recomendada |
| :--- | :--- |
| **Provider** | Neon Database (AWS Region us-east-2 / sa-east-1) |
| **Compute Size** | 0.25 CU (Escalado dinámico a demanda) |
| **SSL Enforcement** | `sslmode=require` obligatorio |
| **Prisma Connection** | Max Connections optimizadas mediante PgBouncer |
