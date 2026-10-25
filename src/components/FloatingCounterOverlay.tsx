import React, { useState } from 'react';
import {
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  X,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { soundEffects } from '../services/audio';
import { AppSettings, ProjectPart } from '../types/amigurumi';

interface FloatingCounterOverlayProps {
  title: string;
  activePart?: ProjectPart;
  parts?: ProjectPart[];
  currentRound: number;
  targetRounds: number;
  currentStitch: number;
  targetStitches: number;
  settings: AppSettings;
  onIncrementRound: () => void;
  onDecrementRound: () => void;
  onIncrementStitch: () => void;
  onDecrementStitch: () => void;
  onResetStitches: () => void;
  onSetTargetStitches: (val: number) => void;
  onSelectPart?: (partId: string) => void;
  onClose: () => void;
}

export const FloatingCounterOverlay: React.FC<FloatingCounterOverlayProps> = ({
  title,
  activePart,
  parts = [],
  currentRound,
  targetRounds,
  currentStitch,
  targetStitches,
  settings,
  onIncrementRound,
  onDecrementRound,
  onIncrementStitch,
  onDecrementStitch,
  onResetStitches,
  onSetTargetStitches,
  onSelectPart,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const isStitchComplete = targetStitches > 0 && currentStitch >= targetStitches;

  // Sound & haptic wrapped triggers
  const handleIncStitch = () => {
    if (isStitchComplete && !settings.autoAdvanceRound) {
      soundEffects.vibrate([30, 30], settings.vibrationEnabled);
      return;
    }
    onIncrementStitch();
  };

  const handleDecStitch = () => {
    if (currentStitch <= 0) return;
    onDecrementStitch();
  };

  const handleIncRound = () => {
    onIncrementRound();
  };

  const handleDecRound = () => {
    if (currentRound <= 1) return;
    onDecrementRound();
  };

  // Multiple parts switching in project mode
  const currentPartIndex = parts.findIndex((p) => p.id === activePart?.id);
  const hasMultipleParts = parts.length > 1;

  const handlePrevPart = () => {
    if (!hasMultipleParts || !onSelectPart || currentPartIndex <= 0) return;
    onSelectPart(parts[currentPartIndex - 1].id);
  };

  const handleNextPart = () => {
    if (!hasMultipleParts || !onSelectPart || currentPartIndex >= parts.length - 1) return;
    onSelectPart(parts[currentPartIndex + 1].id);
  };

  // Minimized Pill Mode (unobtrusive floating badge at bottom-right)
  if (isMinimized) {
    return (
      <div className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-md border border-[#D6C8B8] dark:border-stone-700 shadow-2xl rounded-full p-1.5 pl-3 text-xs animate-slide-up">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-1.5 font-bold text-[#2D2824] dark:text-stone-100 cursor-pointer"
          title="Expandir contador flutuante"
        >
          <span className="text-sm">🧶</span>
          <span className="font-mono-numbers">
            V.{currentRound} • {currentStitch}
            {targetStitches > 0 ? `/${targetStitches}` : ''} pts
          </span>
          <ChevronUp className="w-4 h-4 text-stone-500" />
        </button>

        <button
          onClick={handleIncStitch}
          disabled={isStitchComplete && !settings.autoAdvanceRound}
          className={`w-8 h-8 rounded-full font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs ${
            isStitchComplete && !settings.autoAdvanceRound
              ? 'bg-stone-300 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
              : 'bg-[#8C5E47] hover:bg-[#724A36] text-white active:scale-95'
          }`}
          title={isStitchComplete ? 'Volta completa!' : '+1 Ponto'}
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    );
  }

  // Expanded Floating Card Mode
  return (
    <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-4 sm:w-96 z-40 mx-auto bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-md rounded-3xl border-2 border-[#D6C8B8] dark:border-stone-700 shadow-2xl p-3 space-y-2.5 animate-slide-up">
      {/* Top Bar: Title & Min/Close controls */}
      <div className="flex items-center justify-between border-b border-[#EAE0D2] dark:border-stone-800 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">🧶</span>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#2D2824] dark:text-stone-100 font-comfortaa truncate">
              {activePart ? activePart.name : title}
            </h4>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
              Contador sobreposto à receita
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {hasMultipleParts && onSelectPart && (
            <div className="flex items-center bg-[#EDE4D6] dark:bg-stone-800 rounded-lg p-0.5 mr-1">
              <button
                onClick={handlePrevPart}
                disabled={currentPartIndex <= 0}
                className="p-1 rounded text-stone-600 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                title="Peça anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-bold px-1 text-stone-600 dark:text-stone-300 font-mono">
                {currentPartIndex + 1}/{parts.length}
              </span>
              <button
                onClick={handleNextPart}
                disabled={currentPartIndex >= parts.length - 1}
                className="p-1 rounded text-stone-600 dark:text-stone-300 disabled:opacity-30 cursor-pointer"
                title="Próxima peça"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-xl hover:bg-[#EAE0D2] dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition-colors cursor-pointer"
            title="Minimizar para botão flutuante"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#EAE0D2] dark:hover:bg-stone-800 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer"
            title="Fechar modo tela cheia do PDF"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Counter Row: Voltas & Pontos side-by-side */}
      <div className="grid grid-cols-2 gap-2">
        {/* ROUND (VOLTA) CONTROL */}
        <div className="bg-[#F0E8DC] dark:bg-stone-800/90 rounded-2xl p-2 border border-[#D6C8B8] dark:border-stone-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Volta
            </span>
            {targetRounds > 0 && (
              <span className="text-[10px] font-semibold text-stone-400">
                de {targetRounds}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={handleDecRound}
              disabled={currentRound <= 1}
              className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 border border-[#D6C8B8] dark:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF5ED] active:scale-95 cursor-pointer"
              title="Volta anterior"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="text-xl sm:text-2xl font-black text-[#2D2824] dark:text-stone-100 font-mono-numbers text-center">
              {currentRound}
            </span>

            <button
              onClick={handleIncRound}
              className="px-2.5 h-8 rounded-xl bg-[#C85A32] hover:bg-[#B34B24] text-white font-bold text-xs flex items-center justify-center shadow-xs active:scale-95 cursor-pointer"
              title="Avançar 1 volta"
            >
              <Plus className="w-3.5 h-3.5 mr-0.5" />
              <span>Volta</span>
            </button>
          </div>
        </div>

        {/* STITCH (PONTO) CONTROL */}
        <div className="bg-[#F0E8DC] dark:bg-stone-800/90 rounded-2xl p-2 border border-[#D6C8B8] dark:border-stone-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Pontos
            </span>
            <button
              onClick={onResetStitches}
              disabled={currentStitch === 0}
              className="text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-30 flex items-center gap-0.5 cursor-pointer"
              title="Zerar pontos contados nesta volta (não altera o cronômetro)"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Zerar pts</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-1">
            <button
              onClick={handleDecStitch}
              disabled={currentStitch <= 0}
              className="w-8 h-8 rounded-xl bg-white dark:bg-stone-700 border border-[#D6C8B8] dark:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center justify-center disabled:opacity-30 hover:bg-[#FAF5ED] active:scale-95 cursor-pointer"
              title="Diminuir 1 ponto"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="text-center">
              <div className="flex items-baseline justify-center gap-0.5 font-mono-numbers">
                <span className="text-xl sm:text-2xl font-black text-[#2D2824] dark:text-stone-100">
                  {currentStitch}
                </span>
                {targetStitches > 0 && (
                  <span className="text-xs font-bold text-stone-400">
                    /{targetStitches}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleIncStitch}
              disabled={isStitchComplete && !settings.autoAdvanceRound}
              className={`w-9 h-8 rounded-xl font-bold flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer ${
                isStitchComplete && !settings.autoAdvanceRound
                  ? 'bg-stone-300 dark:bg-stone-700 text-stone-400 cursor-not-allowed opacity-50'
                  : 'bg-[#8C5E47] hover:bg-[#724A36] text-white'
              }`}
              title={isStitchComplete ? 'Volta completa!' : 'Aumentar 1 ponto'}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>

      {/* Target status & quick chips */}
      <div className="pt-1 flex items-center justify-between gap-1 text-[10px]">
        <div>
          {targetStitches > 0 ? (
            isStitchComplete ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                ✓ Volta completa! Avance para a próxima volta.
              </span>
            ) : (
              <span className="text-stone-500 dark:text-stone-400 font-semibold">
                Faltam {targetStitches - currentStitch} pts para completar a volta
              </span>
            )
          ) : (
            <span className="text-stone-400">Sem meta de pontos</span>
          )}
        </div>

        {/* Quick stitch presets */}
        <div className="flex items-center gap-1">
          <span className="text-stone-400">Meta:</span>
          {[6, 12, 18, 24, 30].map((num) => (
            <button
              key={num}
              onClick={() => onSetTargetStitches(num)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                targetStitches === num
                  ? 'bg-[#8C5E47] text-white'
                  : 'bg-[#EDE4D6] dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-[#E2D6C5]'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
