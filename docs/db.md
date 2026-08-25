# Database Specification & Configuration Guide — Neon PostgreSQL

## 1. Overview
Este documento detalla la configuración, cadenas de conexión, esquemas y estrategias de optimización para la base de datos PostgreSQL alojada en **Neon Serverless**.

---

## 2. Connection Architecture & Pooler

Neon proporciona dos tipos de cadenas de conexión:
1. **Direct Connection (Puerto 5432):** Para migraciones DDL (`prisma migrate`, `drizzle-kit push`).
2. **Pooled Connection (Puerto 6543 / PgBouncer):** Para llamadas en runtime / Serverless functions.

### `.env` Setup
```env
# Runtime pooled connection (Usado por la app en Next.js Server Actions)
DATABASE_URL="postgresql://user:password@ep-cool-project-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Direct connection (Usado exclusivamente para migraciones de schema)
DIRECT_URL="postgresql://user:password@ep-cool-project.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

---

## 3. Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

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
  id          String       @id @default(uuid()) @db.Uuid
  title       String       @db.VarChar(255)
  description String?      @db.Text
  status      TaskStatus   @default(PENDING)
  priority    TaskPriority @default(MEDIUM)

  // Tracking de fechas
  startDate   DateTime?    @map("start_date") @db.Timestamptz(6)
  dueDate     DateTime?    @map("due_date") @db.Timestamptz(6)
  endDate     DateTime?    @map("end_date") @db.Timestamptz(6)

  // Metadatos de auditoría y NLP
  rawVoiceInput String?    @map("raw_voice_input") @db.Text
  tags          String[]   @default([])

  createdAt   DateTime     @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime     @updatedAt @map("updated_at") @db.Timestamptz(6)

  @@index([status])
  @@index([dueDate])
  @@index([createdAt])
  @@map("tasks")
}
```

---

## 4. SQL DDL Directo (PostgreSQL Nativo)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE task_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status task_status NOT NULL DEFAULT 'PENDING',
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    start_date TIMESTAMPTZ(6),
    due_date TIMESTAMPTZ(6),
    end_date TIMESTAMPTZ(6),
    raw_voice_input TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización de queries del tablero
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

---

## 5. Database Client Implementation (`src/lib/db.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```
