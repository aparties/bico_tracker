'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Play, 
  Check, 
  ArrowLeft, 
  Trash2, 
  Calendar, 
  Clock, 
  AlertTriangle,
  Inbox,
  Loader2,
  Mic
} from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startDate?: string | null;
  dueDate?: string | null;
  endDate?: string | null;
  rawVoiceInput?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

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

export default function TaskBoard() {
  const queryClient = useQueryClient();

  // Fetch de tareas
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Error al cargar tareas');
      return res.json();
    },
  });

  // Mutación para actualizar estado
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar la tarea');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutación para eliminar tarea
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
        <p className="text-sm font-medium">Cargando tablero de tareas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 bg-red-950/20 border border-red-900/30 rounded-[40px] p-8 max-w-md mx-auto text-red-400">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
        <p className="font-semibold mb-1">Error al conectar con la base de datos</p>
        <p className="text-xs text-red-400/80 mb-4">Asegúrate de configurar DATABASE_URL en tu .env y correr las migraciones.</p>
      </div>
    );
  }

  // Agrupar tareas por estado (excluimos ARCHIVED para este tablero principal)
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const renderColumn = (
    title: string, 
    taskList: Task[], 
    columnStatus: Task['status'],
    accentClass: string,
    bgColorClass: string
  ) => {
    return (
      <div className="flex flex-col flex-1 min-w-[280px] bg-[#081a14] border border-[#1d4034] rounded-[40px] p-6 min-h-[500px]">
        {/* Cabecera de la columna */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#1d4034]">
          <h2 className="text-white font-bold tracking-tight text-lg flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${accentClass}`} />
            {title}
          </h2>
          <span className="bg-[#143028] text-[#a8b5b0] text-xs font-semibold px-3 py-1 rounded-full border border-[#1d4034]">
            {taskList.length}
          </span>
        </div>

        {/* Lista de tareas */}
        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
          {taskList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-emerald-100/10 text-center">
              <Inbox className="w-10 h-10 mb-2" />
              <p className="text-xs font-medium">Sin tareas en este estado</p>
            </div>
          ) : (
            taskList.map((task) => (
              <div 
                key={task.id} 
                className={`bg-[#143028] border rounded-[30px] p-5 hover:shadow-xl transition-all group ${
                  task.priority === 'URGENT' 
                    ? 'border-red-500/40 hover:border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.05)]' 
                    : 'border-[#1d4034] hover:border-[#57cc99]/30'
                }`}
              >
                {/* Título y prioridad */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`font-bold text-sm md:text-base leading-tight transition-colors ${
                    task.priority === 'URGENT' 
                      ? 'text-red-200 group-hover:text-red-400' 
                      : 'text-white group-hover:text-[#80ed99]'
                  }`}>
                    {task.title}
                  </h3>
                  
                  {/* Prioridad Badge */}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    task.priority === 'URGENT'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
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
                  <p className="text-[#a8b5b0] text-xs md:text-sm line-clamp-3 mb-4">
                    {task.description}
                  </p>
                )}

                {/* Fechas */}
                <div className="flex flex-col gap-1.5 mb-4 text-[10px] md:text-xs text-[#a8b5b0]/70 border-t border-[#1d4034] pt-3">
                  {task.startDate && (
                    <div className="flex items-center gap-1.5">
                      <Play className="w-3 h-3 text-[#80ed99] rotate-0" />
                      <span>Inicio: {formatFriendlyDate(task.startDate)}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#57cc99]" />
                      <span className="font-medium text-[#57cc99]">Límite: {formatFriendlyDate(task.dueDate)}</span>
                    </div>
                  )}
                  {task.endDate && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Fin estimado: {formatFriendlyDate(task.endDate)}</span>
                    </div>
                  )}
                </div>

                {/* Transcripción original */}
                {task.rawVoiceInput && (
                  <div className="flex items-start gap-1.5 mt-3 text-[10px] text-[#a8b5b0]/40 italic border-t border-[#1d4034]/10 pt-2.5">
                    <Mic className="w-3 h-3 text-[#57cc99]/30 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2" title={task.rawVoiceInput}>
                      "{task.rawVoiceInput}"
                    </span>
                  </div>
                )}

                {/* Acciones de la Card */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1d4034]/30">
                  {/* Eliminar */}
                  <button
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    disabled={deleteTaskMutation.isPending}
                    className="p-2 text-[#a8b5b0]/50 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Cambiar de Estado */}
                  <div className="flex items-center gap-1">
                    {columnStatus !== 'PENDING' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'PENDING' })}
                        disabled={updateStatusMutation.isPending}
                        className="p-1.5 bg-[#081a14] hover:bg-[#57cc99]/10 text-[#a8b5b0] hover:text-[#57cc99] rounded-full border border-[#1d4034] transition-all"
                        title="Mover a Pendientes"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    {columnStatus === 'PENDING' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'IN_PROGRESS' })}
                        disabled={updateStatusMutation.isPending}
                        className="p-2 bg-[#57cc99]/10 hover:bg-[#57cc99]/20 text-[#57cc99] rounded-full border border-[#57cc99]/20 transition-all flex items-center gap-1 text-[10px] font-bold"
                        title="Iniciar tarea"
                      >
                        <Play className="w-3.5 h-3.5 fill-[#57cc99]" /> Iniciar
                      </button>
                    )}

                    {columnStatus === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: task.id, status: 'COMPLETED' })}
                        disabled={updateStatusMutation.isPending}
                        className="p-2 bg-[#80ed99]/10 hover:bg-[#80ed99]/20 text-[#80ed99] rounded-full border border-[#80ed99]/20 transition-all flex items-center gap-1 text-[10px] font-bold"
                        title="Completar tarea"
                      >
                        <Check className="w-3.5 h-3.5" /> Terminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 pb-16">
      {renderColumn('Pendientes', pendingTasks, 'PENDING', 'bg-[#a8b5b0]', 'border-slate-500')}
      {renderColumn('En Curso', inProgressTasks, 'IN_PROGRESS', 'bg-[#57cc99]', 'border-[#57cc99]')}
      {renderColumn('Terminadas', completedTasks, 'COMPLETED', 'bg-[#80ed99]', 'border-[#80ed99]')}
    </div>
  );
}
