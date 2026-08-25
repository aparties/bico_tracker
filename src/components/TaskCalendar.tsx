'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Trash2, 
  X,
  History,
  Activity
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

export default function TaskCalendar() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-08-25')); // Usando la fecha de referencia del sistema
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Fetch de todas las tareas
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Error al cargar tareas');
      return res.json();
    },
  });

  // Fetch de detalles de la tarea seleccionada (con logs de actividad)
  const { data: taskDetails, isLoading: isLoadingDetails } = useQuery<Task>({
    queryKey: ['task-details', selectedTask?.id],
    queryFn: async () => {
      if (!selectedTask?.id) return null as any;
      const res = await fetch(`/api/tasks/${selectedTask.id}`);
      if (!res.ok) throw new Error('Error al cargar detalle de tarea');
      return res.json();
    },
    enabled: !!selectedTask?.id,
  });

  // Mutación para actualizar estado
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-details', selectedTask?.id] });
    },
  });

  // Mutación para eliminar tarea
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar tarea');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setSelectedTask(null);
    },
  });

  // Helpers de navegación
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (viewMode === 'monthly') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (viewMode === 'yearly') {
      newDate.setFullYear(currentDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'daily') {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (viewMode === 'monthly') {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (viewMode === 'yearly') {
      newDate.setFullYear(currentDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-08-25')); // Fecha de referencia
  };

  // Mapear color de prioridad
  const getPriorityStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'MEDIUM':
        return 'bg-emerald-500/10 text-[#80ed99] border-emerald-500/20';
      case 'LOW':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'IN_PROGRESS': return 'En Curso';
      case 'COMPLETED': return 'Terminado';
      case 'ARCHIVED': return 'Archivado';
    }
  };

  // Helper para verificar si un día coincide con una tarea
  const getTasksForDay = (day: Date) => {
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000 - 1;

    return tasks.filter(task => {
      let match = false;
      if (task.startDate) {
        const start = new Date(task.startDate).getTime();
        if (start >= dayStart && start <= dayEnd) match = true;
      }
      if (task.dueDate) {
        const due = new Date(task.dueDate).getTime();
        if (due >= dayStart && due <= dayEnd) match = true;
      }
      return match;
    });
  };

  // --- RENDERIZADO DE VISTAS ---

  // 1. Vista Diaria
  const renderDailyView = () => {
    const dayTasks = getTasksForDay(currentDate);

    return (
      <div className="bg-[#143028] border border-[#1d4034] rounded-[32px] p-6 min-h-[300px]">
        <h3 className="text-[#80ed99] font-bold mb-6 text-lg flex items-center gap-2 border-b border-[#1d4034] pb-4">
          <Clock className="w-5 h-5" />
          Planificación del {currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>

        {dayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#a8b5b0]">
            <CalendarIcon className="w-12 h-12 mb-3 text-emerald-950" />
            <p>No hay tareas planificadas para este día.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className="bg-[#0b241c] border border-[#1d4034] hover:border-[#57cc99] rounded-2xl p-4 cursor-pointer transition-all hover:translate-x-1 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase border ${getPriorityStyle(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-[#a8b5b0]">
                      {task.status === 'COMPLETED' ? 'Terminado' : 'Activo'}
                    </span>
                  </div>
                  <h4 className="text-white font-bold text-base">{task.title}</h4>
                  {task.description && (
                    <p className="text-[#a8b5b0] text-xs mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[#a8b5b0] w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#1d4034] pt-2 md:pt-0">
                  {task.dueDate && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Límite: {new Date(task.dueDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="text-[#57cc99] font-medium">{getStatusLabel(task.status)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 2. Vista Mensual
  const renderMonthlyView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajustar para iniciar el lunes (0 = Lunes, 6 = Domingo)
    const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    const prevMonthDays = new Date(year, month, 0).getDate();
    const fillerDaysPrev = Array.from({ length: adjustedFirstDayIndex }, (_, i) => prevMonthDays - adjustedFirstDayIndex + i + 1);

    const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
      <div className="bg-[#143028] border border-[#1d4034] rounded-[32px] overflow-hidden">
        {/* Cabecera de días de la semana */}
        <div className="grid grid-cols-7 border-b border-[#1d4034] bg-[#0b241c]/50 text-[#80ed99] text-xs font-bold text-center py-3">
          {weekdays.map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Cuadrícula de días */}
        <div className="grid grid-cols-7 bg-[#0b241c]/10 text-sm">
          {/* Días del mes anterior (relleno) */}
          {fillerDaysPrev.map(day => (
            <div key={`prev-${day}`} className="min-h-[90px] border-r border-b border-[#1d4034]/40 p-2 text-emerald-950/40 select-none">
              {day}
            </div>
          ))}

          {/* Días del mes actual */}
          {daysArray.map(day => {
            const thisDay = new Date(year, month, day);
            const dayTasks = getTasksForDay(thisDay);
            const isToday = thisDay.toDateString() === new Date('2026-08-25').toDateString();

            return (
              <div 
                key={day} 
                className={`min-h-[105px] border-r border-b border-[#1d4034] p-2 flex flex-col justify-between hover:bg-[#143028]/60 transition-colors ${
                  isToday ? 'bg-[#57cc99]/5 border-[#57cc99]/40' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`w-5 h-5 flex items-center justify-center font-bold text-xs rounded-full ${
                    isToday ? 'bg-[#57cc99] text-[#0b241c]' : 'text-[#a8b5b0]'
                  }`}>
                    {day}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] bg-[#1d4034] text-[#80ed99] font-bold px-1.5 py-0.2 rounded">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="flex-1 space-y-1 overflow-y-auto max-h-[75px] pr-1">
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                      }}
                      className="text-[10px] leading-tight font-medium bg-[#0b241c] hover:bg-[#081a14] border border-[#1d4034] hover:border-[#57cc99]/40 text-[#80ed99] px-1.5 py-0.5 rounded cursor-pointer truncate transition-all"
                      title={task.title}
                    >
                      {task.priority === 'URGENT' && '🚨 '}
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div 
                      onClick={() => {
                        setCurrentDate(thisDay);
                        setViewMode('daily');
                      }}
                      className="text-[9px] text-[#a8b5b0] hover:text-[#57cc99] cursor-pointer text-center font-bold"
                    >
                      + {dayTasks.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 3. Vista Anual
  const renderYearlyView = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map(monthIndex => {
          const monthDate = new Date(year, monthIndex, 1);
          const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long' });
          const firstDayIndex = new Date(year, monthIndex, 1).getDay();
          const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
          const totalDays = new Date(year, monthIndex + 1, 0).getDate();
          
          return (
            <div 
              key={monthIndex}
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(monthIndex);
                setCurrentDate(newDate);
                setViewMode('monthly');
              }}
              className="bg-[#143028] border border-[#1d4034] hover:border-[#57cc99]/30 rounded-3xl p-4 cursor-pointer hover:bg-[#143028]/80 transition-all hover:scale-[1.02]"
            >
              <h4 className="text-[#80ed99] font-black capitalize text-center mb-3 text-sm tracking-wide">
                {monthName}
              </h4>
              
              <div className="grid grid-cols-7 gap-1 text-[9px] text-center font-bold text-emerald-800 mb-1.5">
                <div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div><div>D</div>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {/* Filler days */}
                {Array.from({ length: adjustedFirstDayIndex }).map((_, idx) => (
                  <div key={`filler-${idx}`} />
                ))}

                {/* Real month days */}
                {Array.from({ length: totalDays }).map((_, idx) => {
                  const day = idx + 1;
                  const dayDate = new Date(year, monthIndex, day);
                  const dayTasks = getTasksForDay(dayDate);
                  const hasTasks = dayTasks.length > 0;
                  const isToday = dayDate.toDateString() === new Date('2026-08-25').toDateString();

                  // Determinar color de intensidad del día
                  let dayBg = 'text-[#a8b5b0]/30';
                  if (hasTasks) {
                    const hasUrgent = dayTasks.some(t => t.priority === 'URGENT');
                    dayBg = hasUrgent ? 'bg-red-500/20 text-red-300 font-bold rounded-full' : 'bg-[#57cc99]/20 text-[#80ed99] font-bold rounded-full';
                  } else if (isToday) {
                    dayBg = 'bg-[#57cc99] text-[#0b241c] font-black rounded-full';
                  }

                  return (
                    <div 
                      key={day}
                      className={`w-4 h-4 flex items-center justify-center text-[8px] ${dayBg}`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- RENDERING DETAIL MODAL AND LOG TIMELINE ---

  const renderLogTimeline = () => {
    if (isLoadingDetails) {
      return (
        <div className="flex items-center justify-center py-6 text-xs text-[#a8b5b0] gap-2">
          <LoaderSpinner className="animate-spin" /> Cargando historial...
        </div>
      );
    }

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

          // Intentar parsear los valores guardados
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
            if (newVals?.startDate) updates.push('Inicio');
            if (newVals?.dueDate) updates.push('Límite');
            if (newVals?.endDate) updates.push('Témino');
            detailsText = `Parámetros temporales actualizados: ${updates.join(', ')}.`;
          }

          return (
            <div key={log.id} className="relative pl-7 text-left">
              {/* Dot del log */}
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
    <div className="w-full px-6">
      {/* Cabecera del Calendario */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        {/* Navegación y Fecha */}
        <div className="flex items-center gap-4">
          <h2 className="text-white text-xl md:text-2xl font-black capitalize min-w-[180px]">
            {viewMode === 'daily' && currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            {viewMode === 'monthly' && currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            {viewMode === 'yearly' && `Planificación ${currentDate.getFullYear()}`}
          </h2>

          <div className="flex items-center bg-[#143028] border border-[#1d4034] rounded-full p-1">
            <button 
              onClick={handlePrev}
              className="p-1.5 rounded-full hover:bg-[#0b241c] text-[#80ed99] transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={handleToday}
              className="px-3 py-1 rounded-full text-xs font-bold hover:bg-[#0b241c] text-[#80ed99] transition-colors"
            >
              Hoy
            </button>
            <button 
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-[#0b241c] text-[#80ed99] transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toggles de Vista */}
        <div className="flex bg-[#143028] border border-[#1d4034] rounded-full p-1 self-start md:self-auto">
          {(['daily', 'monthly', 'yearly'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                viewMode === mode 
                  ? 'bg-[#57cc99] text-[#0b241c]' 
                  : 'text-[#a8b5b0] hover:text-white'
              }`}
            >
              {mode === 'daily' ? 'Diario' : mode === 'monthly' ? 'Mensual' : 'Anual'}
            </button>
          ))}
        </div>
      </div>

      {/* Renderizado del Calendario según el Modo */}
      {viewMode === 'daily' && renderDailyView()}
      {viewMode === 'monthly' && renderMonthlyView()}
      {viewMode === 'yearly' && renderYearlyView()}

      {/* --- MODAL DETALLE DE TAREA --- */}
      {selectedTask && (
        <div className="fixed inset-0 bg-[#0b241c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#143028] border border-[#1d4034] w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-[#1d4034]">
              <div>
                <span className={`text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border ${getPriorityStyle(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
                <h3 className="text-white font-black text-xl mt-3">{selectedTask.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTask(null)}
                className="text-[#a8b5b0] hover:text-white p-1 rounded-full hover:bg-[#0b241c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Descripción */}
              {selectedTask.description && (
                <div>
                  <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-2">Descripción</h4>
                  <p className="text-[#a8b5b0] text-sm bg-[#0b241c] border border-[#1d4034] p-4 rounded-2xl whitespace-pre-wrap">
                    {selectedTask.description}
                  </p>
                </div>
              )}

              {/* Fechas */}
              <div>
                <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-2.5">Planificación Temporal</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0b241c] border border-[#1d4034] rounded-2xl p-3 flex flex-col">
                    <span className="text-[#a8b5b0] mb-0.5">Inicio</span>
                    <span className="text-white font-bold">
                      {selectedTask.startDate ? new Date(selectedTask.startDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'No definida'}
                    </span>
                  </div>
                  <div className="bg-[#0b241c] border border-[#1d4034] rounded-2xl p-3 flex flex-col">
                    <span className="text-[#a8b5b0] mb-0.5">Límite (Due Date)</span>
                    <span className="text-white font-bold">
                      {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'No definida'}
                    </span>
                  </div>
                  {selectedTask.endDate && (
                    <div className="bg-[#0b241c] border border-[#1d4034] rounded-2xl p-3 flex flex-col col-span-2">
                      <span className="text-[#a8b5b0] mb-0.5">Cierre Real/Estimado</span>
                      <span className="text-white font-bold">
                        {new Date(selectedTask.endDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dictado Original */}
              {selectedTask.rawVoiceInput && (
                <div>
                  <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-2">Dictado Original (NLP)</h4>
                  <p className="text-[#a8b5b0] text-xs italic bg-[#0b241c]/40 border border-[#1d4034]/40 p-3.5 rounded-2xl">
                    "{selectedTask.rawVoiceInput}"
                  </p>
                </div>
              )}

              {/* Historial de Trazabilidad */}
              <div>
                <h4 className="text-[#80ed99] text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  Historial de Cambios (Logs)
                </h4>
                {renderLogTimeline()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-[#1d4034] bg-[#0b241c]/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              {/* Cambiar Estado */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <span className="text-[#a8b5b0] text-xs font-medium">Estado:</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => {
                    const nextStatus = e.target.value as TaskStatus;
                    updateStatusMutation.mutate({ id: selectedTask.id, status: nextStatus });
                    setSelectedTask(prev => prev ? { ...prev, status: nextStatus } : null);
                  }}
                  className="bg-[#081a14] border border-[#1d4034] text-white text-xs font-bold rounded-full px-4 py-2 focus:outline-none focus:border-[#57cc99]"
                >
                  <option value="PENDING">Pendiente</option>
                  <option value="IN_PROGRESS">En Curso</option>
                  <option value="COMPLETED">Terminado</option>
                  <option value="ARCHIVED">Archivado</option>
                </select>
              </div>

              {/* Eliminar Tarea */}
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas eliminar esta tarea permanentemente?')) {
                    deleteTaskMutation.mutate(selectedTask.id);
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-full border border-red-500/20 hover:border-red-500/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar Tarea
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoaderSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin h-4 w-4 text-[#57cc99] ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
