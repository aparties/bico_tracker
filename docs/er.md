# Entity-Relationship Specification (ER Model)

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    TASK {
        uuid id PK "Identificador único (UUID v4)"
        varchar title "Título descriptivo de la tarea"
        text description "Detalle o notas adicionales"
        enum status "PENDING | IN_PROGRESS | COMPLETED | ARCHIVED"
        enum priority "LOW | MEDIUM | HIGH | URGENT"
        timestamptz start_date "Fecha y hora de inicio proyectada o real"
        timestamptz due_date "Fecha límite de presentación"
        timestamptz end_date "Fecha de finalización o cierre"
        text raw_voice_input "Transcripción original de voz / texto natural"
        text_array tags "Etiquetas de clasificación"
        timestamptz created_at "Timestamp de creación"
        timestamptz updated_at "Timestamp de última modificación"
    }

    TASK_ACTIVITY_LOG {
        uuid id PK "Identificador único de log"
        uuid task_id FK "Referencia a la tarea"
        varchar action "CREATE | STATUS_CHANGE | DATE_UPDATE"
        jsonb old_values "Snapshot de valores anteriores"
        jsonb new_values "Snapshot de nuevos valores"
        timestamptz timestamp "Momento del evento"
    }

    TASK ||--o{ TASK_ACTIVITY_LOG : "genera historial"
```

---

## 2. Data Dictionary

### Tabla: `tasks`
| Campo | Tipo | Nulo | Default | Descripción |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | No | `uuid_generate_v4()` | Clave primaria. |
| `title` | `VARCHAR(255)` | No | - | Nombre sintetizado de la tarea. |
| `description` | `TEXT` | Sí | `NULL` | Contexto, especificaciones o enlaces. |
| `status` | `ENUM` | No | `'PENDING'` | Estado dentro del flujo Kanban. |
| `priority` | `ENUM` | No | `'MEDIUM'` | Nivel de criticidad. |
| `start_date` | `TIMESTAMPTZ` | Sí | `NULL` | Momento en el que se comienza a ejecutar. |
| `due_date` | `TIMESTAMPTZ` | Sí | `NULL` | Deadline o fecha de entrega/presentación. |
| `end_date` | `TIMESTAMPTZ` | Sí | `NULL` | Momento de cierre definitivo. |
| `raw_voice_input` | `TEXT` | Sí | `NULL` | Frase textual ingresada antes del NLP. |
| `tags` | `TEXT[]` | No | `ARRAY[]` | Categorías o etiquetas contextuales. |
| `created_at` | `TIMESTAMPTZ` | No | `now()` | Fecha y hora de inserción. |
| `updated_at` | `TIMESTAMPTZ` | No | `now()` | Fecha y hora de última edición. |

---

## 3. Business Integrity Rules & Constraints
1. **Validación Temporal Lógica:**
   - Si `start_date` y `due_date` existen: $\text{start\_date} \le \text{due\_date}$.
   - Si `start_date` y `end_date` existen: $\text{start\_date} \le \text{end\_date}$.
2. **Transiciones de Estado:**
   - Al cambiar a `COMPLETED`, si `end_date` es nulo, el sistema asigna por defecto `end_date = CURRENT_TIMESTAMP`.
