# Database Specification & Configuration Guide — Neon PostgreSQL

## 1. Overview
Este documento detalla la configuración, cadenas de conexión, esquemas y estrategias de optimización para la base de datos PostgreSQL alojada en **Neon Serverless** y gestionada mediante **Prisma Next (Prisma 8)**.

---

## 2. Connection Architecture & Config

Prisma Next se conecta a la base de datos a través de la configuración declarada en `prisma.config.ts` y cargada en el cliente de base de datos `src/prisma/db.ts`.

### `.env` Config
```env
# Cadena de conexión pooled de Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_Dxtn3Lqey8ik@ep-withered-mountain-ayoub384-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

---

## 3. Prisma Next Contract (`src/prisma/contract.prisma`)

El esquema de base de datos físico está definido bajo el contrato de datos en `src/prisma/contract.prisma`:

```prisma
enum TaskStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  ARCHIVED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model Task {
  id            String            @id @default(uuid())
  title         String
  description   String?
  status        TaskStatus        @default(PENDING)
  priority      TaskPriority      @default(MEDIUM)
  startDate     TimestamptzString? @map("start_date")
  dueDate       TimestamptzString? @map("due_date")
  endDate       TimestamptzString? @map("end_date")
  rawVoiceInput String?           @map("raw_voice_input")
  tags          String[]          @default([])
  createdAt     TimestamptzString @default(now()) @map("created_at")
  updatedAt     temporal.updatedAtString() @map("updated_at")

  activityLogs  TaskActivityLog[]

  @@index([status])
  @@index([dueDate])
  @@index([createdAt])
  @@map("tasks")
}

model TaskActivityLog {
  id        String            @id @default(uuid())
  taskId    String            @map("task_id")
  action    String            // "CREATE" | "STATUS_CHANGE" | "DATE_UPDATE" | "UPDATE"
  oldValues Json?             @map("old_values")
  newValues Json?             @map("new_values")
  createdAt TimestamptzString @default(now()) @map("created_at")
  task      Task              @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_activity_logs")
}
```

---

## 4. SQL DDL Directo (PostgreSQL Nativo en Neon)

El esquema generado y aplicado físicamente a la base de datos es:

```sql
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status "TaskStatus" NOT NULL DEFAULT 'PENDING',
    priority "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    start_date TIMESTAMPTZ,
    due_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    raw_voice_input TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE task_activity_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Índices de optimización
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_task_activity_logs_task_id ON task_activity_logs(task_id);
```

---

## 5. Database Client Implementation (`src/prisma/db.ts`)

En Prisma Next, las consultas a base de datos se ejecutan importando `db` desde `src/prisma/db.ts`. El cliente incluye un fallback seguro para evitar que falle la fase de construcción (*build-time*) en plataformas como Vercel si la cadena de conexión no está presente en el servidor de compilación:

```typescript
import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// Fallback de conexión para entornos de compilación (Vercel Build-time)
const dbUrl = process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/postgres';

export const db = postgres<Contract>({
  contractJson,
  url: dbUrl,
});
```
