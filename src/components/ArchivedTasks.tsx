'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trash2, 
  RotateCcw,
  Calendar, 
  Clock, 
  AlertTriangle,
  Inbox,
  Loader2,
  Mic,
  Play
} from 'lucide-react';
import TaskModal from './TaskModal';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

interface TaskActivityLog {
  id: string;
  taskId: string;
  action: string;
  oldValues: any;
  newValues: any;
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  endDate: string | null;
  rawVoiceInput: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  activityLogs?: TaskActivityLog[];
}

// Formateador de fecha
const formatFriendlyDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ArchivedTasks() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch de tareas
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Error al cargar tareas');
      return res.json();
    },
  });

  // Mutación para actualizar estado (Restaurar)
  const restoreStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al restaurar la tarea');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutación para eliminar permanentemente
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar la tarea');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#57cc99]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-sm font-medium">Cargando tareas archivadas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-red-950/20 border border-red-900/30 rounded-[40px] p-8 max-w-md mx-auto text-red-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold mb-1">Error al cargar datos</p>
        <p className="text-xs text-red-400/80 mb-4">No se pudieron recuperar las tareas desde el servidor.</p>
      </div>
    );
  }

  const archivedTasks = tasks.filter(t => t.status === 'ARCHIVED');

  return (
    <div className="max-w-7xl mx-auto px-6 pb-16">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-8 pb-3 border-b border-[#1d4034]">
        <h2 className="text-white font-bold tracking-tight text-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" />
          Tareas Archivadas
        </h2>
        <span className="bg-[#143028] text-[#a8b5b0] text-xs font-semibold px-3 py-1 rounded-full border border-[#1d4034]">
          {archivedTasks.length} {archivedTasks.length === 1 ? 'tarea' : 'tareas'}
        </span>
      </div>

      {/* Grid de tareas */}
      {archivedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-emerald-100/10 text-center max-w-md mx-auto">
          <Inbox className="w-16 h-16 mb-4 text-[#1d4034]" />
          <h3 className="text-white text-lg font-bold mb-2">No hay tareas archivadas</h3>
          <p className="text-xs text-[#a8b5b0] leading-relaxed">
            Las tareas que archives aparecerán aquí. Archivar tareas te ayuda a mantener tu tablero principal enfocado y organizado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedTasks.map((task) => (
            <div 
              key={task.id} 
              onClick={() => setSelectedTask(task)}
              className={`bg-[#143028]/60 border border-[#1d4034] rounded-[30px] p-6 hover:shadow-xl cursor-pointer hover:bg-[#183a30]/80 hover:scale-[1.01] transition-all group relative flex flex-col justify-between ${
                task.priority === 'URGENT' 
                  ? 'border-red-500/20 hover:border-red-500/40' 
                  : 'hover:border-[#57cc99]/30'
              }`}
            >
              <div>
                {/* Título y prioridad */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className={`font-bold text-base md:text-lg leading-tight transition-colors ${
                    task.priority === 'URGENT' 
                      ? 'text-red-200 group-hover:text-red-400' 
                      : 'text-white group-hover:text-[#80ed99]'
                  }`}>
                    {task.title}
                  </h3>
                  
                  {/* Prioridad Badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    task.priority === 'URGENT'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : task.priority === 'HIGH' 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : task.priority === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {task.priority === 'URGENT' ? 'URGENTE' : task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MED' : 'BAJA'}
                  </span>
                </div>

                {/* Descripción */}
                {task.description && (
                  <p className="text-[#a8b5b0]/80 text-xs md:text-sm line-clamp-3 mb-4">
                    {task.description}
                  </p>
                )}

                {/* Fechas */}
                {(task.startDate || task.dueDate || task.endDate) && (
                  <div className="flex flex-col gap-1.5 mb-4 text-[10px] md:text-xs text-[#a8b5b0]/60 border-t border-[#1d4034]/50 pt-3">
                    {task.startDate && (
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-sky-400" />
                        <span>Inicio: {formatFriendlyDate(task.startDate)}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium text-amber-400">Límite: {formatFriendlyDate(task.dueDate)}</span>
                      </div>
                    )}
                    {task.endDate && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Fin estimado: {formatFriendlyDate(task.endDate)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Transcripción original */}
                {task.rawVoiceInput && (
                  <div className="flex items-start gap-1.5 mt-3 text-[10px] text-[#a8b5b0]/40 italic border-t border-[#1d4034]/20 pt-2.5">
                    <Mic className="w-3 h-3 text-indigo-400/40 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2" title={task.rawVoiceInput}>
                      "{task.rawVoiceInput}"
                    </span>
                  </div>
                )}
              </div>

              {/* Acciones de la Card */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1d4034]/40">
                {/* Eliminar permanentemente */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Estás seguro de que deseas eliminar esta tarea permanentemente? Esta acción no se puede deshacer.')) {
                      deleteTaskMutation.mutate(task.id);
                    }
                  }}
                  disabled={deleteTaskMutation.isPending}
                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all flex items-center gap-1 text-[11px] font-bold"
                  title="Eliminar permanentemente"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>

                {/* Restaurar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreStatusMutation.mutate({ id: task.id, status: 'PENDING' });
                  }}
                  disabled={restoreStatusMutation.isPending}
                  className="p-2 bg-[#57cc99]/10 hover:bg-[#57cc99]/20 text-[#57cc99] rounded-full border border-[#57cc99]/20 hover:border-[#57cc99]/30 transition-all flex items-center gap-1 text-[11px] font-bold"
                  title="Restaurar a Pendientes"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTask && (
        <TaskModal 
          task={selectedTask as any} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
