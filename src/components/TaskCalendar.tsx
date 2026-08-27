'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock
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

  // Note: Unused queries/mutations removed as they are now encapsulated in the TaskModal component.

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
      if (task.status === 'ARCHIVED') return false;

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

  // renderLogTimeline and unused priority styling helpers removed as they are now inside TaskModal

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
        <TaskModal 
          task={selectedTask as any} 
          onClose={() => setSelectedTask(null)} 
        />
      )}
    </div>
  );
}
