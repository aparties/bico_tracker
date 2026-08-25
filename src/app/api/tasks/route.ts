import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { createActivityLog } from '@/lib/activityLog';

const createTaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  rawVoiceInput: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
});

export async function GET() {
  try {
    // Listar todas las tareas ordenadas por fecha de creación descendente
    const tasks = await db.orm.public.Task
      .orderBy(m => m.createdAt.desc())
      .all();

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tareas', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de entrada no válidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Reglas de integridad de fechas
    if (data.startDate) {
      const startMs = new Date(data.startDate).getTime();

      if (data.dueDate) {
        const dueMs = new Date(data.dueDate).getTime();
        if (startMs > dueMs) {
          return NextResponse.json(
            { error: 'Regla de Integridad Temporal: La fecha de inicio (start_date) no puede ser posterior a la fecha límite (due_date).' },
            { status: 400 }
          );
        }
      }

      if (data.endDate) {
        const endMs = new Date(data.endDate).getTime();
        if (startMs > endMs) {
          return NextResponse.json(
            { error: 'Regla de Integridad Temporal: La fecha de inicio (start_date) no puede ser posterior a la fecha de término (end_date).' },
            { status: 400 }
          );
        }
      }
    }

    // Regla de transición de estado
    let finalEndDate = data.endDate || null;
    if (data.status === 'COMPLETED' && !finalEndDate) {
      finalEndDate = new Date().toISOString();
    }

    const task = await db.orm.public.Task.create({
      title: data.title,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      startDate: data.startDate || null,
      dueDate: data.dueDate || null,
      endDate: finalEndDate,
      rawVoiceInput: data.rawVoiceInput || null,
      tags: data.tags || [],
    });

    // Registrar historial de actividad
    await createActivityLog({
      taskId: task.id,
      action: 'CREATE',
      newValues: task,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Error al crear la tarea', details: error.message },
      { status: 500 }
    );
  }
}
