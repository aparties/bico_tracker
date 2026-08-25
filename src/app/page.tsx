'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Kanban, Sparkles } from 'lucide-react';
import VoiceInput from '@/components/VoiceInput';
import TaskBoard from '@/components/TaskBoard';

export default function Home() {
  const queryClient = useQueryClient();

  const handleTaskCreated = () => {
    // Forzar recarga del listado en el TaskBoard
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0b241c] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0b241c] to-[#0b241c]">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-8 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5 bg-[#143028] border border-[#1d4034] rounded-full px-5 py-2 mb-6">
          <Kanban className="w-5 h-5 text-[#57cc99]" />
          <span className="text-[#57cc99] font-bold text-xs uppercase tracking-wider">
            Bicode Control System
          </span>
        </div>
        
        <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight mb-4">
          Bicode Tracker
        </h1>
        
        <p className="text-[#a8b5b0] text-sm md:text-base max-w-xl leading-relaxed flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#80ed99] flex-shrink-0" />
          Dicta o escribe tus tareas para procesarlas y guardarlas automáticamente con Inteligencia Artificial.
        </p>
      </header>

      {/* Entrada Inteligente por Voz / Texto */}
      <section className="mb-2">
        <VoiceInput onTaskCreated={handleTaskCreated} />
      </section>

      {/* Tablero Kanban principal */}
      <main className="max-w-7xl mx-auto pb-16">
        <TaskBoard />
      </main>
    </div>
  );
}
