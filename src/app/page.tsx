'use client';

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Kanban, Calendar as CalendarIcon, Sparkles, LayoutGrid } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import TaskBoard from '@/components/TaskBoard';
import TaskCalendar from '@/components/TaskCalendar';

export default function Home() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'kanban' | 'calendar'>('kanban');

  const handleTaskCreated = () => {
    // Forzar recarga del listado
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0b241c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0b241c] to-[#0b241c]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5 bg-[#143028] border border-[#1d4034] rounded-full px-5 py-2 mb-6">
          <Kanban className="w-5 h-5 text-[#57cc99]" />
          <span className="text-[#57cc99] font-bold text-xs uppercase tracking-wider">
            Bicode Control System
          </span>
        </div>
        
        <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight mb-4">
          Bicode Tracker
        </h1>
        
        <p className="text-[#a8b5b0] text-sm md:text-base max-w-xl leading-relaxed flex items-center justify-center gap-1.5 mb-6">
          <Sparkles className="w-4 h-4 text-[#80ed99] flex-shrink-0" />
          Dicta o escribe tus tareas para procesarlas y guardarlas automáticamente con Inteligencia Artificial.
        </p>

        {/* Toggles de Vista */}
        <div className="flex bg-[#143028] border border-[#1d4034] rounded-full p-1">
          <button
            onClick={() => setActiveView('kanban')}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeView === 'kanban'
                ? 'bg-[#57cc99] text-[#0b241c] shadow-[0_0_12px_rgba(87,204,153,0.3)]'
                : 'text-[#a8b5b0] hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Tablero Kanban
          </button>
          <button
            onClick={() => setActiveView('calendar')}
            className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeView === 'calendar'
                ? 'bg-[#57cc99] text-[#0b241c] shadow-[0_0_12px_rgba(87,204,153,0.3)]'
                : 'text-[#a8b5b0] hover:text-white'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Vista Calendario
          </button>
        </div>
      </header>

      {/* Entrada Inteligente por Voz / Texto */}
      <section className="mb-2">
        <VoiceInput onTaskCreated={handleTaskCreated} />
      </section>

      {/* Vistas Principales */}
      <main className="max-w-7xl mx-auto pb-16">
        {activeView === 'kanban' ? (
          <TaskBoard />
        ) : (
          <TaskCalendar />
        )}
      </main>
    </div>
  );
}
