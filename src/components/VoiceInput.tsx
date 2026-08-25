'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Sparkles } from 'lucide-react';

type VoiceInputProps = {
  onTaskCreated: () => void;
};

export default function VoiceInput({ onTaskCreated }: VoiceInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Tu navegador o dispositivo no soporta el dictado por voz.');
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'es-ES';

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Permiso de micrófono denegado. Habilítalo en los ajustes de tu iPhone (Safari/Chrome y Privacidad).');
        } else if (event.error === 'audio-capture') {
          setError('No se pudo acceder al micrófono. Asegúrate de que no esté en uso por otra app.');
        } else if (event.error === 'service-not-allowed') {
          setError('Servicio de dictado no disponible. Activa "Dictado" en Ajustes -> General -> Teclado de tu iPhone.');
        } else {
          setError(`Error al capturar audio (${event.error}). Intenta de nuevo.`);
        }
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(transcript);
        handleParseTask(transcript);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e: any) {
      console.error('Error starting speech recognition:', e);
      setError('Error al iniciar la grabación de voz.');
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const handleParseTask = async (taskText: string) => {
    const textToSubmit = taskText.trim();
    if (!textToSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textToSubmit }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar la tarea');
      }

      setText('');
      onTaskCreated(); // Notificar al componente padre para refrescar la lista
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al enviar la tarea');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParseTask(text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-10 px-4">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Escribe o dicta: "Presentar informe final, inicia este jueves a las 8am y termina el 12"'
          disabled={isLoading}
          className="w-full bg-[#081a14] border border-[#1d4034] text-white placeholder-emerald-100/20 text-sm md:text-base rounded-full pl-6 pr-24 py-4 md:py-5 focus:outline-none focus:border-[#57cc99] focus:ring-1 focus:ring-[#57cc99] transition-all"
        />

        <div className="absolute right-3 flex items-center gap-2">
          {/* Botón de Micrófono */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={isLoading}
            className={`p-2.5 md:p-3 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-[#57cc99]/10 hover:bg-[#57cc99]/20 text-[#57cc99] border border-[#57cc99]/20 hover:border-[#57cc99]/30'
            }`}
            title="Dictar tarea por voz"
          >
            {isListening ? (
              <MicOff className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Mic className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isLoading || !text.trim()}
            className={`p-2.5 md:p-3 rounded-full flex items-center justify-center transition-all ${
              isLoading || !text.trim()
                ? 'bg-emerald-900/10 text-emerald-800 border border-[#1d4034]'
                : 'bg-[#57cc99] hover:bg-[#80ed99] text-[#0b241c] font-bold hover:shadow-[0_0_15px_rgba(87,204,153,0.4)]'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        </div>
      </form>

      {/* Onda de Escucha Activa */}
      {isListening && (
        <div className="flex justify-center items-center gap-1.5 mt-3 text-xs text-[#57cc99]">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          Escuchando activamente... Habla para registrar tu tarea.
          <span className="flex gap-0.5 ml-1">
            <span className="w-1 h-3 bg-[#57cc99] rounded animate-[bounce_1s_infinite_100ms]" />
            <span className="w-1 h-4 bg-[#57cc99] rounded animate-[bounce_1s_infinite_200ms]" />
            <span className="w-1 h-2 bg-[#57cc99] rounded animate-[bounce_1s_infinite_300ms]" />
          </span>
        </div>
      )}

      {/* Errores */}
      {error && (
        <div className="mt-3 text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-4 py-2.5 rounded-2xl text-center">
          {error}
        </div>
      )}
    </div>
  );
}
