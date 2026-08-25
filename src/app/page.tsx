'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Sparkles, LayoutGrid } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import TaskBoard from '@/components/TaskBoard';
import TaskCalendar from '@/components/TaskCalendar';

export default function Home() {
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<'kanban' | 'calendar'>('kanban');
  const [mounted, setMounted] = useState(false);
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    setMounted(true);
    // Formatear fecha para Perú (GMT-5)
    const dateString = new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setFormattedDate(dateString.charAt(0).toUpperCase() + dateString.slice(1));
  }, []);

  const handleTaskCreated = () => {
    // Forzar recarga del listado
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0b241c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0b241c] to-[#0b241c]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 pt-20 pb-4 flex flex-col items-center text-center">
        {/* Logo y Bicode Control Badge */}
        <div className="flex items-center gap-3 mb-8 bg-[#143028]/80 border border-[#1d4034] rounded-full pl-3 pr-6 py-2 shadow-[0_0_15px_rgba(87,204,153,0.05)]">
          <img src="/logo.png" alt="Bicode Control Logo" className="w-8 h-8 rounded-full object-cover border border-[#1d4034]" />
          <div className="flex flex-col items-start leading-none text-left">
            <span className="text-white font-black text-sm tracking-wide">
              Bicode Control
            </span>
            <span className="text-[#57cc99] text-[9px] font-black uppercase tracking-widest mt-0.5">
              System
            </span>
          </div>
        </div>
        
        <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight mb-6">
          Bicode Tracker
        </h1>

        {/* Fecha de hoy (Perú, GMT-5) */}
        {mounted && (
          <div className="text-xs text-[#80ed99] bg-[#143028] border border-[#1d4034] rounded-full px-4.5 py-1.5 font-bold mb-7 flex items-center gap-2 shadow-[0_0_12px_rgba(87,204,153,0.03)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#57cc99] animate-pulse" />
            Hoy: {formattedDate} (GMT-5)
          </div>
        )}
        
        <p className="text-[#a8b5b0] text-sm md:text-base max-w-xl leading-relaxed flex items-center justify-center gap-1.5 mb-10">
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
      <section className="mt-8 mb-14">
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
