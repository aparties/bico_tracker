import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/prisma/db';

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  rawVoiceInput: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // Obtener la tarea existente para validar reglas de negocio de forma agregada
    const existingTask = await db.orm.public.Task.where({ id }).first();
    if (!existingTask) {
      return NextResponse.json(
        { error: 'La tarea especificada no existe.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const result = updateTaskSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de actualización no válidos', details: result.error.format() },
        { status: 400 }
      );
    }

    const updateData = { ...result.data };

    // Unificar fechas existentes con las nuevas para validar
    const mergedStartDate = updateData.startDate !== undefined ? updateData.startDate : existingTask.startDate;
    const mergedDueDate = updateData.dueDate !== undefined ? updateData.dueDate : existingTask.dueDate;
    const mergedEndDate = updateData.endDate !== undefined ? updateData.endDate : existingTask.endDate;

    if (mergedStartDate) {
      const startMs = new Date(mergedStartDate).getTime();

      if (mergedDueDate) {
        const dueMs = new Date(mergedDueDate).getTime();
        if (startMs > dueMs) {
          return NextResponse.json(
            { error: 'Regla de Integridad Temporal: La fecha de inicio (start_date) no puede ser posterior a la fecha límite (due_date).' },
            { status: 400 }
          );
        }
      }

      if (mergedEndDate) {
        const endMs = new Date(mergedEndDate).getTime();
        if (startMs > endMs) {
          return NextResponse.json(
            { error: 'Regla de Integridad Temporal: La fecha de inicio (start_date) no puede ser posterior a la fecha de término (end_date).' },
            { status: 400 }
          );
        }
      }
    }

    // Regla de transición de estado:
    // "Al cambiar a COMPLETED, si end_date es nulo, el sistema asigna por defecto end_date = CURRENT_TIMESTAMP"
    const finalStatus = updateData.status !== undefined ? updateData.status : existingTask.status;
    if (finalStatus === 'COMPLETED' && !mergedEndDate) {
      updateData.endDate = new Date().toISOString();
    }

    // Actualizar la tarea filtrando por ID
    const updated = await db.orm.public.Task.where({ id }).update(updateData);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la tarea', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Eliminar la tarea filtrando por ID
    const deleted = await db.orm.public.Task.where({ id }).delete();

    return NextResponse.json(deleted);
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la tarea', details: error.message },
      { status: 500 }
    );
  }
}
