'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, 
  Calendar, 
  Clock, 
  Mic, 
  Trash2, 
  History, 
  AlertTriangle, 
  Edit3, 
  Save, 
  Undo,
  Play,
  Check,
  Loader2
} from 'lucide-react';

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

interface TaskModalProps {
  task: Task;
  onClose: () => void;
}

// Helper to convert ISO string to YYYY-MM-DDTHH:MM for datetime-local
const toLocalDatetimeString = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper to convert local string to ISO string for backend
const toISODatetimeString = (localStr?: string | null) => {
  if (!localStr) return null;
  const d = new Date(localStr);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};

export default function TaskModal({ task, onClose }: TaskModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [startDate, setStartDate] = useState(toLocalDatetimeString(task.startDate));
  const [dueDate, setDueDate] = useState(toLocalDatetimeString(task.dueDate));
  const [endDate, setEndDate] = useState(toLocalDatetimeString(task.endDate));

  // Reset form when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);
    setStartDate(toLocalDatetimeString(task.startDate));
    setDueDate(toLocalDatetimeString(task.dueDate));
    setEndDate(toLocalDatetimeString(task.endDate));
    setErrorMessage(null);
  }, [task]);

  // Fetch full details (including logs)
  const { data: taskDetails, isLoading: isLoadingDetails } = useQuery<Task>({
    queryKey: ['task-details', task.id],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}`);
      if (!res.ok) throw new Error('Error al cargar detalle de la tarea');
      return res.json();
    },
    initialData: task,
  });

  // Save changes mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedFields: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al actualizar la tarea');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-details', task.id] });
      setIsEditing(false);
      setErrorMessage(null);
      
      // Update form state with the latest saved data
      setTitle(data.title);
      setDescription(data.description || '');
      setPriority(data.priority);
      setStatus(data.status);
      setStartDate(toLocalDatetimeString(data.startDate));
      setDueDate(toLocalDatetimeString(data.dueDate));
      setEndDate(toLocalDatetimeString(data.endDate));
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Ocurrió un error al guardar los cambios.');
    }
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la tarea');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const getPriorityStyle = (p: TaskPriority) => {
    switch (p) {
      case 'URGENT': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW': return 'bg-emerald-500/10 text-[#80ed99] border-emerald-500/20';
    }
  };

  const getStatusLabel = (s: TaskStatus) => {
    switch (s) {
      case 'PENDING': return 'Pendiente';
      case 'IN_PROGRESS': return 'En Curso';
      case 'COMPLETED': return 'Terminado';
      case 'ARCHIVED': return 'Archivado';
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage('El título de la tarea no puede estar vacío.');
      return;
    }

    const payload: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      startDate: toISODatetimeString(startDate),
      dueDate: toISODatetimeString(dueDate),
      endDate: toISODatetimeString(endDate),
    };

    updateTaskMutation.mutate(payload);
  };

  const handleCancelEdit = () => {
    // Restore states
    setTitle(taskDetails?.title || task.title);
    setDescription(taskDetails?.description || task.description || '');
    setPriority(taskDetails?.priority || task.priority);
    setStatus(taskDetails?.status || task.status);
    setStartDate(toLocalDatetimeString(taskDetails?.startDate || task.startDate));
    setDueDate(toLocalDatetimeString(taskDetails?.dueDate || task.dueDate));
    setEndDate(toLocalDatetimeString(taskDetails?.endDate || task.endDate));
    setIsEditing(false);
    setErrorMessage(null);
  };

  const renderLogTimeline = () => {
    const logs = taskDetails?.activityLogs || [];
    if (logs.length === 0) {
      return (
        <div className="text-[#a8b5b0] text-xs italic py-4 text-center">
          No hay registros de actividad guardados.
        </div>
      );
    }

    return (
      <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#1d4034]">
        {logs.map((log) => {
          const logDate = new Date(log.createdAt);
          const timeString = logDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
          
          let actionLabel = 'Modificación';
          let actionColor = 'bg-[#1d4034] border-[#57cc99]/30 text-[#80ed99]';
          let detailsText = '';

          let oldVals: any = null;
          let newVals: any = null;
          try {
            oldVals = typeof log.oldValues === 'string' ? JSON.parse(log.oldValues) : log.oldValues;
            newVals = typeof log.newValues === 'string' ? JSON.parse(log.newValues) : log.newValues;
          } catch(e) {}

          if (log.action === 'CREATE') {
            actionLabel = 'Tarea Creada';
            actionColor = 'bg-emerald-950 border-emerald-500/20 text-[#80ed99]';
            detailsText = 'La tarea fue agregada e incorporada al sistema.';
          } else if (log.action === 'STATUS_CHANGE') {
            actionLabel = 'Cambio de Estado';
            actionColor = 'bg-blue-950 border-blue-500/20 text-blue-300';
            if (oldVals?.status && newVals?.status) {
              detailsText = `Estado modificado de "${getStatusLabel(oldVals.status)}" a "${getStatusLabel(newVals.status)}".`;
            }
          } else if (log.action === 'DATE_UPDATE') {
            actionLabel = 'Fechas Modificadas';
            actionColor = 'bg-orange-950 border-orange-500/20 text-orange-300';
            const updates: string[] = [];
            if (newVals?.startDate !== undefined) updates.push('Inicio');
            if (newVals?.dueDate !== undefined) updates.push('Límite');
            if (newVals?.endDate !== undefined) updates.push('Término');
            detailsText = `Parámetros temporales actualizados: ${updates.join(', ')}.`;
          } else if (log.action === 'UPDATE') {
            actionLabel = 'Datos Actualizados';
            actionColor = 'bg-[#1d4034] border-[#57cc99]/30 text-emerald-300';
            const updates: string[] = [];
            if (newVals?.title !== undefined) updates.push('Título');
            if (newVals?.description !== undefined) updates.push('Descripción');
            if (newVals?.priority !== undefined) updates.push('Prioridad');
            detailsText = `Se modificaron los siguientes campos: ${updates.join(', ')}.`;
          }

          return (
            <div key={log.id} className="relative pl-7 text-left">
              <div className="absolute left-[7.5px] top-1.5 w-2 h-2 rounded-full bg-[#57cc99] ring-4 ring-[#143028]" />
              <div className="bg-[#0b241c] border border-[#1d4034] rounded-xl p-3">
                <div className="flex justify-between items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${actionColor}`}>
                    {actionLabel}
                  </span>
                  <span className="text-[10px] text-[#a8b5b0]">
                    {timeString}
                  </span>
                </div>
                <p className="text-xs text-white">{detailsText || 'Detalles de actualización registrados.'}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0b241c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#143028] border border-[#1d4034] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start p-6 border-b border-[#1d4034]">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <h3 className="text-white font-black text-xl">Editar Tarea</h3>
            ) : (
              <div>
                <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border ${getPriorityStyle(taskDetails?.priority || task.priority)}`}>
                  {taskDetails?.priority || task.priority}
                </span>
                <h3 className="text-white font-black text-xl mt-3 leading-snug">
                  {taskDetails?.title || task.title}
                </h3>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-[#a8b5b0] hover:text-white p-1.5 rounded-full hover:bg-[#0b241c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2 bg-red-950/20 border border-red-500/30 text-red-400 p-3.5 rounded-2xl text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isEditing ? (
            /* --- EDIT MODE FORM --- */
            <form onSubmit={handleSave} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#80ed99] uppercase tracking-wider mb-1.5">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#081a14] border border-[#1d4034] text-white text-sm rounded-2xl px-4 py-3 focus:outline-none focus:border-[#57cc99] transition-all"
                  placeholder="Ej. Entrega de módulos"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#80ed99] uppercase tracking-wider mb-1.5">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#081a14] border border-[#1d4034] text-white text-sm rounded-2xl px-4 py-3 h-24 focus:outline-none focus:border-[#57cc99] transition-all resize-none"
                  placeholder="Descripción detallada de la tarea..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-[#80ed99] uppercase tracking-wider mb-1.5">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#081a14] border border-[#1d4034] text-white text-xs font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-[#57cc99] transition-all"
                  >
                    <option value="LOW">BAJA</option>
                    <option value="MEDIUM">MED</option>
                    <option value="HIGH">ALTA</option>
                    <option value="URGENT">URGENTE</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-[#80ed99] uppercase tracking-wider mb-1.5">Estado</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full bg-[#081a14] border border-[#1d4034] text-white text-xs font-bold rounded-2xl px-4 py-3 focus:outline-none focus:border-[#57cc99] transition-all"
                  >
                    <option value="PENDING">Pendiente</option>
                    <option value="IN_PROGRESS">En Curso</option>
                    <option value="COMPLETED">Terminado</option>
                    <option value="ARCHIVED">Archivado</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-3.5 border-t border-[#1d4034] pt-4 mt-4">
                <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider">Planificación Temporal</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#a8b5b0] uppercase tracking-wider mb-1">Fecha de Inicio</label>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#081a14] border border-[#1d4034] text-white text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-[#57cc99] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#a8b5b0] uppercase tracking-wider mb-1">Fecha Límite</label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#081a14] border border-[#1d4034] text-white text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-[#57cc99] transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-[#a8b5b0] uppercase tracking-wider mb-1">Cierre Real / Estimado</label>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#081a14] border border-[#1d4034] text-white text-xs rounded-2xl px-4 py-3 focus:outline-none focus:border-[#57cc99] transition-all"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* --- VIEW DETAILS MODE --- */
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-2">Descripción</h4>
                {taskDetails?.description ? (
                  <p className="text-[#a8b5b0] text-sm bg-[#0b241c] border border-[#1d4034] p-4 rounded-2xl whitespace-pre-wrap leading-relaxed">
                    {taskDetails.description}
                  </p>
                ) : (
                  <p className="text-[#a8b5b0]/40 text-xs italic bg-[#0b241c]/50 border border-[#1d4034]/30 p-4 rounded-2xl">
                    Sin descripción asignada.
                  </p>
                )}
              </div>

              {/* Dates */}
              <div>
                <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-2.5">Planificación Temporal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0b241c] border border-[#1d4034] rounded-2xl p-3.5 flex flex-col">
                    <span className="text-[#a8b5b0] mb-0.5 font-medium">Inicio</span>
                    <span className="text-white font-bold">
                      {taskDetails?.startDate 
                        ? new Date(taskDetails.startDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) 
                        : 'No definida'}
                    </span>
                  </div>
                  <div className="bg-[#0b241c] border border-[#1d4034] rounded-2xl p-3.5 flex flex-col">
                    <span className="text-[#a8b5b0] mb-0.5 font-medium">Límite (Due Date)</span>
                    <span className="text-white font-bold">
                      {taskDetails?.dueDate 
                        ? new Date(taskDetails.dueDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) 
                        : 'No definida'}
                    </span>
                  </div>
                  {taskDetails?.endDate && (
                    <div className="bg-[#0b241c] border border-[#1d4034] rounded-2xl p-3.5 flex flex-col sm:col-span-2">
                      <span className="text-[#a8b5b0] mb-0.5 font-medium">Cierre Real / Estimado</span>
                      <span className="text-white font-bold">
                        {new Date(taskDetails.endDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Original Dictation (NLP) */}
              {taskDetails?.rawVoiceInput && (
                <div>
                  <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-2">Dictado Original (NLP)</h4>
                  <p className="text-[#a8b5b0] text-xs italic bg-[#0b241c]/40 border border-[#1d4034]/40 p-4 rounded-2xl leading-relaxed flex items-start gap-2">
                    <Mic className="w-3.5 h-3.5 text-[#57cc99] mt-0.5 flex-shrink-0" />
                    <span>"{taskDetails.rawVoiceInput}"</span>
                  </p>
                </div>
              )}

              {/* Activity Logs */}
              <div>
                <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  Historial de Cambios (Logs)
                </h4>
                {renderLogTimeline()}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-[#1d4034] bg-[#0b241c]/50">
          {isEditing ? (
            /* --- FOOTER EDIT MODE --- */
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-full border border-zinc-700 transition-all flex items-center gap-1.5"
              >
                <Undo className="w-3.5 h-3.5" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateTaskMutation.isPending}
                className="px-5 py-2.5 bg-[#57cc99] hover:bg-[#80ed99] text-[#0b241c] font-bold text-xs rounded-full transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(87,204,153,0.2)] disabled:opacity-50"
              >
                {updateTaskMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Guardar Cambios
              </button>
            </div>
          ) : (
            /* --- FOOTER VIEW MODE --- */
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              
              {/* Quick Status Dropdown */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <span className="text-[#a8b5b0] text-xs font-medium">Estado:</span>
                <select
                  value={taskDetails?.status || task.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as TaskStatus;
                    updateTaskMutation.mutate({ status: nextStatus });
                  }}
                  className="bg-[#081a14] border border-[#1d4034] text-white text-xs font-bold rounded-full px-4 py-2 focus:outline-none focus:border-[#57cc99] transition-all"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En Curso</option>
                  <option value="COMPLETED">Terminado</option>
                  <option value="ARCHIVED">Archivado</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta tarea permanentemente?')) {
                      deleteTaskMutation.mutate();
                    }
                  }}
                  disabled={deleteTaskMutation.isPending}
                  className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-full border border-red-500/20 hover:border-red-500/30 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-5 py-2.5 bg-[#57cc99]/10 hover:bg-[#57cc99]/20 text-[#57cc99] font-bold text-xs rounded-full border border-[#57cc99]/20 hover:border-[#57cc99]/30 flex items-center justify-center gap-1.5 transition-all w-full sm:w-auto"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
