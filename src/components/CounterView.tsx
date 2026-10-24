import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { AmigurumiProject, AppSettings, ColorReminder, ProjectPart } from '../types/amigurumi';
import { soundEffects } from '../services/audio';
import {
  Plus,
  Minus,
  RotateCcw,
  Palette,
  Layers,
  Sparkles,
  CheckCircle2,
  Circle,
  HelpCircle,
  Hash,
  ChevronRight,
  BellRing,
  Volume2,
  VolumeX,
  FileText,
} from 'lucide-react';

interface CounterViewProps {
  project: AmigurumiProject;
  settings: AppSettings;
  onUpdateProject: (updatedProject: AmigurumiProject) => void;
  onOpenColorModal: () => void;
  onOpenPartsModal: () => void;
  onOpenPdfModal: () => void;
  onTriggerColorAlert: (reminder: ColorReminder, partName: string) => void;
}

export const CounterView: React.FC<CounterViewProps> = ({
  project,
  settings,
  onUpdateProject,
  onOpenColorModal,
  onOpenPartsModal,
  onOpenPdfModal,
  onTriggerColorAlert,
}) => {
  const [jumpRoundInput, setJumpRoundInput] = useState<string>('');
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);
  const [editingInstruction, setEditingInstruction] = useState<boolean>(false);
  const [customInstruction, setCustomInstruction] = useState<string>('');

  // Find active part
  const activePart =
    project.parts.find((p) => p.id === project.activePartId) || project.parts[0] || null;

  // Active color reminder for this round
  const currentColorReminder = activePart?.colorReminders?.find(
    (r) => r.round === activePart.currentRound
  );

  // Next upcoming color reminder
  const nextColorReminder = activePart?.colorReminders
    ?.filter((r) => r.round > (activePart.currentRound || 1))
    ?.sort((a, b) => a.round - b.round)[0];

  // Check if we just landed on a color change round to notify
  const checkColorAlert = useCallback(
    (roundNum: number, part: ProjectPart) => {
      const match = part.colorReminders?.find((r) => r.round === roundNum);
      if (match) {
        soundEffects.playColorChangeAlert(settings.soundEnabled, settings.soundVolume);
        soundEffects.vibrate([100, 50, 100], settings.vibrationEnabled);
        onTriggerColorAlert(match, part.name);
      }
    },
    [settings.soundEnabled, settings.soundVolume, settings.vibrationEnabled, onTriggerColorAlert]
  );

  // Update current part helper
  const updateCurrentPart = useCallback(
    (partial: Partial<ProjectPart>) => {
      if (!activePart) return;
      const updatedPart: ProjectPart = { ...activePart, ...partial };
      const updatedParts = project.parts.map((p) => (p.id === activePart.id ? updatedPart : p));
      onUpdateProject({
        ...project,
        parts: updatedParts,
      });
    },
    [activePart, project, onUpdateProject]
  );

  // Increment Round
  const handleIncrementRound = useCallback(() => {
    if (!activePart) return;
    const nextRound = activePart.currentRound + 1;
    soundEffects.playRoundChime(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(60, settings.vibrationEnabled);

    updateCurrentPart({
      currentRound: nextRound,
      currentStitch: 0, // Reset stitch counter for the fresh round
    });

    checkColorAlert(nextRound, activePart);
  }, [activePart, settings, updateCurrentPart, checkColorAlert]);

  // Decrement Round
  const handleDecrementRound = useCallback(() => {
    if (!activePart || activePart.currentRound <= 1) return;
    const prevRound = activePart.currentRound - 1;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(30, settings.vibrationEnabled);

    updateCurrentPart({
      currentRound: prevRound,
      currentStitch: 0,
    });
  }, [activePart, settings, updateCurrentPart]);

  // Increment Stitch
  const handleIncrementStitch = useCallback(() => {
    if (!activePart) return;
    const nextStitch = activePart.currentStitch + 1;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(25, settings.vibrationEnabled);

    // If auto-advance enabled and reached target stitches for this round
    if (
      settings.autoAdvanceRound &&
      activePart.targetStitches > 0 &&
      nextStitch >= activePart.targetStitches
    ) {
      handleIncrementRound();
    } else {
      updateCurrentPart({ currentStitch: nextStitch });
    }
  }, [activePart, settings, updateCurrentPart, handleIncrementRound]);

  // Decrement Stitch
  const handleDecrementStitch = useCallback(() => {
    if (!activePart || activePart.currentStitch <= 0) return;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(20, settings.vibrationEnabled);
    updateCurrentPart({ currentStitch: activePart.currentStitch - 1 });
  }, [activePart, settings, updateCurrentPart]);

  // Reset Stitches in current round
  const handleResetStitches = () => {
    if (!activePart) return;
    updateCurrentPart({ currentStitch: 0 });
    soundEffects.vibrate(40, settings.vibrationEnabled);
  };

  // Jump to specific round
  const handleJumpToRound = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePart) return;
    const target = parseInt(jumpRoundInput);
    if (!isNaN(target) && target >= 1) {
      updateCurrentPart({ currentRound: target, currentStitch: 0 });
      checkColorAlert(target, activePart);
    }
    setShowJumpModal(false);
    setJumpRoundInput('');
  };

  // Mark piece completed with victory celebration
  const handleCompletePart = () => {
    if (!activePart) return;
    const newState = !activePart.isCompleted;
    updateCurrentPart({ isCompleted: newState });

    if (newState) {
      soundEffects.playVictorySound(settings.soundEnabled, settings.soundVolume);
      soundEffects.vibrate([100, 50, 100, 50, 200], settings.vibrationEnabled);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6'],
        });
      } catch {
        // Confetti handled
      }
    }
  };

  // Keyboard shortcut listener for PC crocheters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'ArrowUp') {
        e.preventDefault();
        handleIncrementRound();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleDecrementRound();
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleIncrementStitch();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDecrementStitch();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleResetStitches();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleIncrementRound, handleDecrementRound, handleIncrementStitch, handleDecrementStitch]);

  if (!activePart) {
    return (
      <div className="p-8 text-center text-stone-500">
        Nenhuma peça encontrada. Crie uma peça para começar a contar!
      </div>
    );
  }

  const roundProgress = Math.min(
    100,
    Math.round((activePart.currentRound / Math.max(1, activePart.targetRounds)) * 100)
  );

  const currentRoundInstruction =
    activePart.roundInstructions?.[activePart.currentRound] || '';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-20">
      {/* 1. Part Selector Carousel */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
        {project.parts.map((part) => {
          const isSelected = part.id === activePart.id;
          return (
            <button
              key={part.id}
              onClick={() => onUpdateProject({ ...project, activePartId: part.id })}
              className={`px-3.5 py-2 rounded-2xl flex items-center gap-2 shrink-0 transition-all text-xs font-bold border cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-amber-300'
              }`}
            >
              {part.isCompleted ? (
                <CheckCircle2 className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
              ) : (
                <Circle className="w-3.5 h-3.5 opacity-60" />
              )}
              <span>{part.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-amber-600 text-amber-100' : 'bg-stone-100 dark:bg-stone-700 text-stone-500'
                }`}
              >
                v.{part.currentRound}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenPartsModal}
          className="p-2 rounded-2xl border border-dashed border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:text-amber-600 hover:border-amber-400 bg-white dark:bg-stone-800 shrink-0 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Gerenciar todas as peças"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Peças</span>
        </button>
      </div>

      {/* 2. Color Change Alert Card (When currently on a color change round) */}
      {currentColorReminder ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-stone-900 dark:to-stone-800 border-2 border-amber-400 dark:border-amber-600 shadow-lg shadow-amber-500/10 flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl shadow-md border-2 border-white dark:border-stone-700 shrink-0 ring-4 ring-amber-300 dark:ring-amber-800 flex items-center justify-center"
              style={{ backgroundColor: currentColorReminder.colorHex }}
            >
              <Sparkles className="w-5 h-5 text-white drop-shadow" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <BellRing className="w-3 h-3" /> Troca de cor nesta volta!
              </span>
              <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100 truncate">
                {currentColorReminder.colorName}
              </h4>
              {currentColorReminder.note && (
                <p className="text-xs text-amber-800 dark:text-amber-300 truncate font-medium">
                  💡 {currentColorReminder.note}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onOpenColorModal}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 cursor-pointer shadow-sm"
          >
            Editar
          </button>
        </div>
      ) : nextColorReminder ? (
        /* Upcoming color reminder pill */
        <div
          onClick={onOpenColorModal}
          className="p-3 rounded-2xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-amber-300 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-5 h-5 rounded-full border border-stone-300 shadow-xs shrink-0"
              style={{ backgroundColor: nextColorReminder.colorHex }}
            />
            <span className="text-stone-500 dark:text-stone-400">
              Próxima troca na <strong className="text-stone-800 dark:text-stone-200">Volta {nextColorReminder.round}</strong>:
            </span>
            <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
              {nextColorReminder.colorName}
            </span>
          </div>

          <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center text-[11px] shrink-0">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : (
        /* No color reminder prompt */
        <div
          onClick={onOpenColorModal}
          className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-pink-500" />
            Configurar lembretes de troca de cor para esta peça
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">+ Adicionar</span>
        </div>
      )}

      {/* 3. The Main Amigurumi Round Counter Box */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-200/90 dark:border-stone-700 shadow-xl shadow-stone-200/40 dark:shadow-none space-y-5 relative overflow-hidden">
        {/* Header bar inside counter: Part Name & Completion Toggle */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-700 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={handleCompletePart}
              className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200"
              title={activePart.isCompleted ? 'Marcar como não concluída' : 'Marcar como pronta'}
            >
              {activePart.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-300">Peça Concluída!</span>
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 text-stone-400" />
                  <span>Em progresso</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1.5 bg-stone-50 dark:bg-stone-900/50 px-2 py-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold">Total:</span>
              <input
                type="number"
                min="0"
                max="999"
                placeholder="Ex: 24"
                value={activePart.targetRounds > 0 ? activePart.targetRounds : ''}
                onChange={(e) => updateCurrentPart({ targetRounds: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-14 px-1 py-0.5 text-center text-xs font-black rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-mono-numbers focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[11px] text-stone-400 font-medium">voltas</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowJumpModal(true)}
              className="p-1.5 text-stone-500 hover:text-amber-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Pular direto para outra volta"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Ir para...</span>
            </button>
          </div>
        </div>

        {/* Current Round Instruction if available */}
        {currentRoundInstruction && (
          <div className="p-3 bg-amber-50 dark:bg-stone-900/60 rounded-2xl border border-amber-200/70 dark:border-stone-700 flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider text-[10px] bg-amber-200/60 dark:bg-amber-950 px-2 py-0.5 rounded-md">
              Receita v.{activePart.currentRound}
            </span>
            <span className="font-bold text-stone-800 dark:text-stone-200">
              {currentRoundInstruction}
            </span>
          </div>
        )}

        {/* Big Round Counter Display */}
        <div className="text-center py-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            VOLTA ATUAL
          </span>
          <div className="flex items-baseline justify-center gap-2 mt-1">
            <span className="text-7xl sm:text-8xl font-black text-stone-900 dark:text-stone-50 font-mono-numbers tracking-tight">
              {activePart.currentRound}
            </span>
            {activePart.targetRounds > 0 && (
              <span className="text-xl sm:text-2xl font-bold text-stone-400 dark:text-stone-500 font-mono-numbers">
                / {activePart.targetRounds}
              </span>
            )}
          </div>

          {/* Progress bar of the piece */}
          <div className="w-full max-w-md mx-auto bg-stone-100 dark:bg-stone-700 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300"
              style={{ width: `${roundProgress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold text-stone-400 mt-1 block">
            {roundProgress}% concluído desta peça
          </span>
        </div>

        {/* Big Touch Buttons for Round (Designed for one-hand phone crocheting) */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {/* -1 Volta button */}
          <button
            onClick={handleDecrementRound}
            disabled={activePart.currentRound <= 1}
            className="py-5 px-3 rounded-2xl bg-stone-100 dark:bg-stone-700/80 hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-800 dark:text-stone-200 font-extrabold text-sm flex flex-col items-center justify-center gap-1 tactile-btn cursor-pointer shadow-xs border border-stone-200/60 dark:border-stone-600"
          >
            <Minus className="w-6 h-6 stroke-[3]" />
            <span className="text-[11px] font-black uppercase tracking-wider">-1 Volta</span>
          </button>

          {/* Main +1 Volta Button (Spans 2 columns, huge touch target) */}
          <button
            onClick={handleIncrementRound}
            className="col-span-2 py-5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg flex items-center justify-center gap-3 tactile-btn shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95"
          >
            <Plus className="w-7 h-7 stroke-[3.5]" />
            <div className="text-left">
              <span className="block text-lg leading-tight font-comfortaa">+1 VOLTA</span>
              <span className="block text-[10px] font-bold text-amber-100 tracking-wider uppercase">
                Próxima Volta
              </span>
            </div>
          </button>
        </div>

        {/* 4. Stitch Counter inside the round */}
        {settings.showStitchCounter && (
          <div className="pt-4 border-t border-stone-100 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pontos nesta volta
              </span>
              <button
                onClick={handleResetStitches}
                disabled={activePart.currentStitch === 0}
                className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Zerar pontos
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
              <button
                onClick={handleDecrementStitch}
                disabled={activePart.currentStitch <= 0}
                className="w-12 h-12 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-700 tactile-btn cursor-pointer"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="text-center">
                <span className="text-3xl font-black text-stone-800 dark:text-stone-100 font-mono-numbers">
                  {activePart.currentStitch}
                </span>
                {activePart.targetStitches > 0 && (
                  <span className="text-sm font-semibold text-stone-400 dark:text-stone-500 font-mono-numbers">
                    {' '}/ {activePart.targetStitches} pts
                  </span>
                )}
                <span className="block text-[10px] text-stone-400 font-medium">pontos feitos</span>
              </div>

              <button
                onClick={handleIncrementStitch}
                className="w-16 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center justify-center tactile-btn shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Quick Tools Bar */}
      <div className="grid grid-cols-3 gap-2 px-1 text-xs">
        <button
          onClick={onOpenColorModal}
          className="py-3 px-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-pink-300 text-stone-700 dark:text-stone-300 font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <Palette className="w-4 h-4 text-pink-500 shrink-0" />
          <span className="truncate">Cores</span>
          {activePart.colorReminders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 text-[9px] flex items-center justify-center shrink-0">
              {activePart.colorReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenPartsModal}
          className="py-3 px-2 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-amber-300 text-stone-700 dark:text-stone-300 font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <Layers className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">Peças</span>
          <span className="w-4 h-4 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[9px] flex items-center justify-center shrink-0">
            {project.parts.length}
          </span>
        </button>

        <button
          onClick={onOpenPdfModal}
          className="py-3 px-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-amber-900 dark:text-amber-200 font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="truncate">Receita PDF</span>
        </button>
      </div>

      {/* Jump to Round Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xs w-full p-5 shadow-2xl">
            <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 mb-2 font-comfortaa">
              Ir para Volta Específica
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Digite o número da volta para pular diretamente:
            </p>
            <form onSubmit={handleJumpToRound} className="space-y-3">
              <input
                type="number"
                min="1"
                max="500"
                placeholder="Ex: 18"
                value={jumpRoundInput}
                onChange={(e) => setJumpRoundInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono-numbers text-center text-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJumpModal(false)}
                  className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Pular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
