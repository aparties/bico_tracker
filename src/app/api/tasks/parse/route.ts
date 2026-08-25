import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { db } from '@/prisma/db';
import { createActivityLog } from '@/lib/activityLog';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'El campo "text" es obligatorio y debe ser una cadena.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          error: 'GEMINI_API_KEY no está configurada en las variables de entorno.',
          fallback: true
        },
        { status: 500 }
      );
    }

    // Configurar el proveedor de Google con la clave personalizada
    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Obtener fecha de referencia para resolver términos relativos
    const now = new Date();
    const currentDayOfWeek = now.toLocaleDateString('es-ES', { weekday: 'long' });
    const currentDateString = now.toISOString();

    const { object } = await generateObject({
      model: googleProvider('gemini-3.6-flash'),
      schema: z.object({
        title: z.string().describe('Un título conciso y representativo de la tarea'),
        description: z.string().nullable().optional().describe('Detalles adicionales o descripción de la tarea'),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).default('PENDING'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
        startDate: z.string().nullable().optional().describe('Fecha y hora de inicio de la tarea en formato ISO 8601'),
        dueDate: z.string().nullable().optional().describe('Fecha y hora límite de entrega (fecha de presentación/límite) en formato ISO 8601'),
        endDate: z.string().nullable().optional().describe('Fecha y hora de término estimada o real en formato ISO 8601'),
      }),
      prompt: `Analiza y extrae la tarea de este texto en español: "${text}"`,
      system: `Eres un asistente experto en procesamiento de lenguaje natural (NLP) diseñado para un gestor de tareas.
Extrae los campos de la tarea a partir del texto ingresado por el usuario.

Fecha de referencia actual (hoy): ${currentDateString}
Día de la semana actual: ${currentDayOfWeek}

Instrucciones críticas:
1. Resuelve todos los términos de fecha relativos (ejemplo: "este jueves", "mañana", "el 10 de septiembre", "la próxima semana") usando la fecha de referencia actual como base.
   - Si hoy es martes 25 de agosto de 2026:
     * "este jueves" -> jueves 27 de agosto de 2026.
     * "10 de septiembre" -> 10 de septiembre de 2026.
     * "termina el 12" -> se refiere al 12 de septiembre de 2026.
   - Si no se especifica hora, puedes usar un valor por defecto lógico (ej. 09:00:00 para startDate, 18:00:00 para dueDate y endDate) o dejar solo la fecha.
2. Mapea "inicia/comienza" a 'startDate'.
3. Mapea "se presenta/vence/límite/entrega" a 'dueDate'.
4. Mapea "termina/finaliza/fin" a 'endDate'.
5. Si no se especifican algunas fechas, déjalas como null.
6. Mapea la prioridad si se menciona explícitamente (ej. "urgente/crítico" -> URGENT, "importante/alta" -> HIGH, "media" -> MEDIUM, "baja" -> LOW). Si no se menciona, usa MEDIUM.
7. Mapea el estado si se infiere (ej. "ya terminé X" -> COMPLETED). Por defecto es PENDING.`,
    });

    // Validaciones lógicas de fechas
    let finalStartDate = object.startDate || null;
    let finalDueDate = object.dueDate || null;
    let finalEndDate = object.endDate || null;

    if (finalStartDate) {
      const startMs = new Date(finalStartDate).getTime();

      if (finalDueDate) {
        const dueMs = new Date(finalDueDate).getTime();
        if (startMs > dueMs) {
          return NextResponse.json(
            { error: 'Regla de Integridad Temporal: La fecha de inicio (start_date) no puede ser posterior a la fecha límite (due_date).' },
            { status: 400 }
          );
        }
      }

      if (finalEndDate) {
        const endMs = new Date(finalEndDate).getTime();
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
    if (object.status === 'COMPLETED' && !finalEndDate) {
      finalEndDate = now.toISOString();
    }

    // Guardar en la base de datos de Neon utilizando el cliente de Prisma Next
    const task = await db.orm.public.Task.create({
      title: object.title,
      description: object.description || null,
      status: object.status,
      priority: object.priority,
      startDate: finalStartDate,
      dueDate: finalDueDate,
      endDate: finalEndDate,
      rawVoiceInput: text,
      tags: [],
    });

    // Registrar historial de actividad
    await createActivityLog({
      taskId: task.id,
      action: 'CREATE',
      newValues: task,
    });

    return NextResponse.json({
      success: true,
      data: task,
      parsed: object,
    });
  } catch (error: any) {
    console.error('Error parsing and creating task:', error);
    return NextResponse.json(
      { error: 'Error al procesar la tarea.', details: error.message },
      { status: 500 }
    );
  }
}
