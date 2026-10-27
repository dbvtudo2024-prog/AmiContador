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
  Hash,
  ChevronRight,
  BellRing,
  FileText,
  Target,
  Pencil,
  Check,
  Mic,
  MicOff,
} from 'lucide-react';
import { ProjectStopwatch } from './ProjectStopwatch';
import { speechService } from '../services/speech';

interface CounterViewProps {
  project: AmigurumiProject;
  settings: AppSettings;
  onUpdateProject: (updatedProject: AmigurumiProject) => void;
  onOpenColorModal: () => void;
  onOpenPartsModal: () => void;
  onOpenPdfModal: () => void;
  onTriggerColorAlert: (reminder: ColorReminder, partName: string) => void;
  onSwitchToFreeCounter?: () => void;
}

export const CounterView: React.FC<CounterViewProps> = ({
  project,
  settings,
  onUpdateProject,
  onOpenColorModal,
  onOpenPartsModal,
  onOpenPdfModal,
  onTriggerColorAlert,
  onSwitchToFreeCounter,
}) => {
  const [jumpRoundInput, setJumpRoundInput] = useState<string>('');
  const [showJumpModal, setShowJumpModal] = useState<boolean>(false);

  // Find active part
  const activePart =
    project.parts.find((p) => p.id === project.activePartId) || project.parts[0] || null;

  // Target rounds collapsed state
  const [isTargetCollapsed, setIsTargetCollapsed] = useState<boolean>(
    (activePart?.targetRounds || 0) > 0
  );
  const [targetInputValue, setTargetInputValue] = useState<string>(
    activePart && activePart.targetRounds > 0 ? String(activePart.targetRounds) : ''
  );

  // Hands-free voice recognition state
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (activePart) {
      setTargetInputValue(activePart.targetRounds > 0 ? String(activePart.targetRounds) : '');
      setIsTargetCollapsed(activePart.targetRounds > 0);
    }
  }, [activePart?.id]);

  // Active color reminder for this round:
  // Only triggers for real color changes mid-piece (round > 1), NEVER on round 1 (which is just the starting color)
  const currentColorReminder =
    activePart?.colorReminders?.find((r) => r.round === activePart.currentRound && r.round > 1) || null;

  // Next upcoming color reminder (only true color changes where round > 1)
  const nextColorReminder = activePart?.colorReminders
    ?.filter((r) => r.round > Math.max(1, activePart.currentRound || 1))
    ?.sort((a, b) => a.round - b.round)[0];

  // Check if we just landed on a color change round to notify
  const checkColorAlert = useCallback(
    (roundNum: number, part: ProjectPart) => {
      if (roundNum <= 1) return; // Never alert on round 1!
      const match = part.colorReminders?.find((r) => r.round === roundNum && r.round > 1);
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

    // If next round has specific target stitches extracted from recipe
    const nextStitches = activePart.roundStitches?.[nextRound] || activePart.targetStitches;

    updateCurrentPart({
      currentRound: nextRound,
      currentStitch: 0,
      targetStitches: nextStitches,
    });

    checkColorAlert(nextRound, activePart);
  }, [activePart, settings, updateCurrentPart, checkColorAlert]);

  // Decrement Round
  const handleDecrementRound = useCallback(() => {
    if (!activePart || activePart.currentRound <= 1) return;
    const prevRound = activePart.currentRound - 1;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(30, settings.vibrationEnabled);

    const prevStitches = activePart.roundStitches?.[prevRound] || activePart.targetStitches;

    updateCurrentPart({
      currentRound: prevRound,
      currentStitch: 0,
      targetStitches: prevStitches,
    });
  }, [activePart, settings, updateCurrentPart]);

  // Increment Stitch
  const handleIncrementStitch = useCallback(() => {
    if (!activePart) return;

    // Prevent counting past round completion
    if (activePart.targetStitches > 0 && activePart.currentStitch >= activePart.targetStitches) {
      if (settings.autoAdvanceRound) {
        handleIncrementRound();
      }
      return;
    }

    const nextStitch = activePart.currentStitch + 1;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(25, settings.vibrationEnabled);

    if (
      settings.autoAdvanceRound &&
      activePart.targetStitches > 0 &&
      nextStitch >= activePart.targetStitches
    ) {
      handleIncrementRound();
    } else {
      const cappedStitch = activePart.targetStitches > 0 ? Math.min(nextStitch, activePart.targetStitches) : nextStitch;
      updateCurrentPart({ currentStitch: cappedStitch });
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

  const handleConfirmTarget = (num?: number) => {
    const val = num !== undefined ? num : parseInt(targetInputValue);
    const valid = isNaN(val) || val < 0 ? 0 : val;
    updateCurrentPart({ targetRounds: valid });
    setTargetInputValue(valid > 0 ? String(valid) : '');
    setIsTargetCollapsed(true);
  };

  // Mark piece completed with celebration
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
          colors: ['#D97706', '#E11D48', '#8B5CF6', '#059669', '#3B82F6'],
        });
      } catch {}
    }
  };

  // Keyboard shortcut listener for PC crocheters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Hands-free voice recognition toggle
  const toggleVoiceControl = useCallback(() => {
    if (!speechService.isSupported()) {
      alert('Seu navegador não possui suporte ao microfone para reconhecimento de voz.');
      return;
    }
    if (isListening) {
      speechService.stop();
      setIsListening(false);
      setVoiceFeedback(null);
    } else {
      speechService.start({
        onCommand: (command, transcript) => {
          if (command === 'stitch_inc') {
            handleIncrementStitch();
            setVoiceFeedback(`+1 ponto ("${transcript}")`);
          } else if (command === 'stitch_dec') {
            handleDecrementStitch();
            setVoiceFeedback(`-1 ponto ("${transcript}")`);
          } else if (command === 'round_inc') {
            handleIncrementRound();
            setVoiceFeedback(`+1 volta ("${transcript}")`);
          }
          setTimeout(() => setVoiceFeedback(null), 2500);
        },
        onStatusChange: (listening) => {
          setIsListening(listening);
        },
        onError: () => {},
      });
      setIsListening(true);
    }
  }, [isListening, handleIncrementStitch, handleDecrementStitch, handleIncrementRound]);

  useEffect(() => {
    return () => {
      speechService.stop();
    };
  }, []);

  if (!activePart) {
    return (
      <div className="p-8 text-center text-stone-500 font-medium">
        Nenhuma peça encontrada. Crie uma peça para começar a tecer!
      </div>
    );
  }

  const roundProgress = activePart.targetRounds > 0
    ? Math.min(100, Math.round((activePart.currentRound / activePart.targetRounds) * 100))
    : 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-2.5 sm:space-y-3.5 pb-16">
      {/* 0. Project Stopwatch Timer & Voice Control Bar */}
      <div className="space-y-2">
        <ProjectStopwatch
          totalSeconds={project.totalTimeSeconds || 0}
          isRunning={project.isTimerRunning}
          onUpdateSeconds={(sec) => onUpdateProject({ ...project, totalTimeSeconds: sec })}
          onToggleRunning={(running) => onUpdateProject({ ...project, isTimerRunning: running })}
          soundEnabled={settings.soundEnabled}
          vibrationEnabled={settings.vibrationEnabled}
        />

        {/* Voice Control Toggle & Switch to Free Counter */}
        <div className="flex items-center justify-between px-1 gap-2">
          <button
            onClick={toggleVoiceControl}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-[#FAF5ED] hover:bg-[#F2ECE1] dark:bg-stone-800 text-[#2D2824] dark:text-stone-100 border-[#D6C8B8] dark:border-stone-700'
            }`}
            title={
              isListening
                ? 'Comando de voz ativo! Fale: "ponto", "menos" ou "volta"'
                : 'Ativar controle por voz sem as mãos (fale "ponto" ou "volta")'
            }
          >
            {isListening ? (
              <Mic className="w-3.5 h-3.5 text-white" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-[#8C5E47] dark:text-stone-300" />
            )}
            <span>{isListening ? 'Ouvindo comandos de voz...' : 'Comando por Voz'}</span>
          </button>

          {onSwitchToFreeCounter && (
            <button
              onClick={onSwitchToFreeCounter}
              className="px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95 shrink-0"
              title="Abrir o Contador Livre rápido sem projeto"
            >
              <span>⚡</span>
              <span>Modo Livre</span>
            </button>
          )}
        </div>

        {/* Voice Feedback Alert */}
        {isListening && (
          <div className="px-3.5 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-center justify-between shadow-xs animate-fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="font-bold truncate">
                {voiceFeedback ? `Comando: ${voiceFeedback}` : 'Mãos livres ativo: fale "ponto", "menos" ou "volta"'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleVoiceControl}
              className="text-[10px] font-bold text-rose-700 dark:text-rose-300 underline cursor-pointer ml-2 shrink-0"
            >
              Desativar
            </button>
          </div>
        )}
      </div>

      {/* 1. Part Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none px-0.5">
        {project.parts.map((part) => {
          const isSelected = part.id === activePart.id;
          return (
            <button
              key={part.id}
              onClick={() => onUpdateProject({ ...project, activePartId: part.id })}
              className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shrink-0 transition-all text-xs font-bold border cursor-pointer ${
                isSelected
                  ? 'bg-[#8C5E47] text-white border-[#6F442F] shadow-xs'
                  : 'bg-[#FAF5ED] dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-[#D6C8B8] dark:border-stone-700 hover:border-[#8C5E47]/50'
              }`}
            >
              {part.isCompleted ? (
                <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
              ) : (
                <Circle className="w-3 h-3 opacity-60" />
              )}
              <span>{part.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-[#6F442F] text-amber-100'
                    : 'bg-[#EDE4D6] dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                v.{part.currentRound}
              </span>
            </button>
          );
        })}

        <button
          onClick={onOpenPartsModal}
          className="p-1.5 px-2.5 rounded-2xl border border-dashed border-[#D6C8B8] dark:border-stone-700 text-[#8C5E47] dark:text-amber-400 hover:bg-[#FAF5ED] dark:hover:bg-stone-800 bg-[#FAF5ED] shrink-0 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          title="Gerenciar peças do projeto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nova Peça</span>
        </button>
      </div>

      {/* 2. Target Rounds Setup (Collapsible to keep button high up!) */}
      {isTargetCollapsed ? (
        <div className="stitched-card rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 text-[#C85A32] shrink-0" />
            <span className="text-[#2D2824] dark:text-stone-200 font-bold truncate">
              {activePart.targetRounds > 0 ? (
                <>
                  Meta: <strong className="text-[#C85A32]">{activePart.targetRounds} voltas</strong>
                  <span className="text-[11px] text-stone-500 font-normal ml-1">
                    ({activePart.currentRound} de {activePart.targetRounds})
                  </span>
                </>
              ) : (
                <span className="text-stone-500">Sem meta de voltas definida</span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsTargetCollapsed(false)}
            className="text-[11px] font-bold text-[#8C5E47] dark:text-amber-400 hover:underline flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#EDE4D6] dark:bg-stone-800 shrink-0 cursor-pointer transition-colors"
          >
            <Pencil className="w-3 h-3" />
            <span>Alterar</span>
          </button>
        </div>
      ) : (
        <div className="stitched-card p-3.5 sm:p-4 rounded-3xl space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C85A32]/15 text-[#C85A32] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-bold text-[#2D2824] dark:text-stone-200 block font-comfortaa">
                  Quantas voltas tem esta peça?
                </label>
                <p className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">
                  {activePart.targetRounds > 0
                    ? `Meta atual: ${activePart.targetRounds} voltas`
                    : 'Defina a meta de voltas da receita'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="number"
                min="0"
                max="999"
                placeholder="Ex: 36"
                value={targetInputValue}
                onChange={(e) => setTargetInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmTarget();
                  }
                }}
                className="w-20 px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-center font-bold text-base text-[#2D2824] dark:text-stone-100 font-mono-numbers focus:border-[#C85A32] focus:outline-none"
              />
              <span className="text-xs font-semibold text-stone-500">voltas</span>
              <button
                type="button"
                onClick={() => handleConfirmTarget()}
                className="px-3 py-1.5 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs ml-auto sm:ml-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#EAE0D2] dark:border-stone-700/60">
            <span className="text-[10px] text-stone-500 mr-1">Sugestões:</span>
            {[12, 18, 24, 30, 36, 42].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleConfirmTarget(num)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activePart.targetRounds === num
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'bg-[#EDE4D6] hover:bg-[#E3D9CA] dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleConfirmTarget(0)}
              className="text-[11px] text-stone-500 hover:text-stone-800 underline ml-auto cursor-pointer"
            >
              Sem meta
            </button>
          </div>
        </div>
      )}

      {/* 3. Color Alert Ribbon */}
      {currentColorReminder ? (
        <div className="p-3.5 rounded-2xl bg-[#FFF6EE] dark:bg-stone-900 border-2 border-[#F4A261] shadow-md flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl shadow-sm border border-stone-300 shrink-0 flex items-center justify-center ring-2 ring-amber-300"
              style={{ backgroundColor: currentColorReminder.colorHex }}
            >
              <Sparkles className="w-4 h-4 text-white drop-shadow" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A32] flex items-center gap-1">
                <BellRing className="w-3 h-3" /> Troca de cor nesta volta!
              </span>
              <h4 className="text-sm font-extrabold text-[#2D2824] dark:text-stone-100 truncate">
                Mudar para: {currentColorReminder.colorName}
              </h4>
            </div>
          </div>
          <button
            onClick={onOpenColorModal}
            className="px-2.5 py-1 rounded-xl bg-[#C85A32] hover:bg-[#B24822] text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Editar
          </button>
        </div>
      ) : nextColorReminder ? (
        <div
          onClick={onOpenColorModal}
          className="p-2.5 rounded-2xl bg-[#FAF5ED] dark:bg-stone-800/80 border border-[#D6C8B8] dark:border-stone-700 flex items-center justify-between gap-2 text-xs cursor-pointer hover:border-[#C85A32] transition-all shadow-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-4 h-4 rounded-full border border-stone-300 shadow-xs shrink-0"
              style={{ backgroundColor: nextColorReminder.colorHex }}
            />
            <span className="text-stone-500 dark:text-stone-400">
              Próxima troca na <strong>Volta {nextColorReminder.round}</strong>:
            </span>
            <span className="font-bold text-stone-800 dark:text-stone-200 truncate">
              {nextColorReminder.colorName}
            </span>
          </div>
          <span className="text-[#8C5E47] dark:text-amber-400 font-bold flex items-center text-[11px] shrink-0">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : null}

      {/* 4. Main Amigurumi Counter Card - Sticky so buttons never disappear on scroll */}
      <div className="stitched-card p-4 sm:p-5 rounded-3xl shadow-md space-y-3.5 relative overflow-hidden sticky top-0 z-10 bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-700">
        {/* Top bar inside counter */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EAE0D2] dark:border-stone-700/60 pb-2.5">
          <button
            onClick={handleCompletePart}
            className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer bg-[#EDE4D6] hover:bg-[#E3D9CA] dark:bg-stone-800 text-[#2D2824] dark:text-stone-200"
          >
            {activePart.isCompleted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Concluída! 🎉</span>
              </>
            ) : (
              <>
                <Circle className="w-3.5 h-3.5 text-stone-400" />
                <span>Em andamento</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowJumpModal(true)}
            className="px-2 py-1 text-stone-500 hover:text-[#8C5E47] dark:text-stone-400 hover:bg-[#EDE4D6] dark:hover:bg-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Pular volta</span>
          </button>
        </div>

        {/* Big Round Counter Display */}
        <div className="text-center py-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8C5E47] dark:text-amber-400 font-comfortaa block">
            VOLTA ATUAL
          </span>
          <div className="flex items-baseline justify-center gap-2 mt-0.5">
            <span className="text-6xl sm:text-7xl font-black text-[#2D2824] dark:text-stone-50 font-mono-numbers tracking-tight">
              {activePart.currentRound}
            </span>
            {activePart.targetRounds > 0 && (
              <span className="text-2xl sm:text-3xl font-bold text-stone-400 dark:text-stone-500 font-mono-numbers">
                / {activePart.targetRounds}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {activePart.targetRounds > 0 && (
            <div className="w-full max-w-sm mx-auto bg-[#E5DCD0] dark:bg-stone-800 h-2 rounded-full overflow-hidden mt-2.5">
              <div
                className="h-full bg-gradient-to-r from-[#D97706] to-[#C85A32] transition-all duration-300"
                style={{ width: `${roundProgress}%` }}
              />
            </div>
          )}
          <span className="text-[10px] font-medium text-stone-500 mt-1 block">
            {activePart.targetRounds > 0
              ? `${roundProgress}% concluído (${activePart.currentRound} de ${activePart.targetRounds} voltas)`
              : `Volta ${activePart.currentRound}`}
          </span>
        </div>

        {/* Main Touch Buttons: directly under thumb */}
        <div className="grid grid-cols-3 gap-2.5 pt-0.5">
          <button
            onClick={handleDecrementRound}
            disabled={activePart.currentRound <= 1}
            className="py-4 sm:py-5 px-3 rounded-2xl craft-btn-secondary disabled:opacity-40 font-bold text-sm flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <Minus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">-1 Volta</span>
          </button>

          <button
            onClick={handleIncrementRound}
            className="col-span-2 craft-btn-primary py-4 sm:py-5 px-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 cursor-pointer shadow-md"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
            <div className="text-left">
              <span className="block text-lg sm:text-xl leading-tight font-comfortaa font-bold">+1 VOLTA</span>
              <span className="block text-[10px] sm:text-[11px] text-white/90 tracking-wider font-medium uppercase">
                Próxima Volta
              </span>
            </div>
          </button>
        </div>

        {/* Stitch Counter with Target Stitches Field */}
        {settings.showStitchCounter && (
          <div className="pt-3 border-t border-[#EAE0D2] dark:border-stone-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 font-comfortaa">
                <span>🪡</span> Pontos na volta {activePart.currentRound}
              </span>

              <div className="flex items-center gap-2">
                {/* Field to define total stitches for the round */}
                <div className="flex items-center gap-1 bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 px-2 py-1 rounded-xl shadow-2xs">
                  <label htmlFor="project-target-stitches" className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                    Total da volta:
                  </label>
                  <input
                    id="project-target-stitches"
                    type="number"
                    min="0"
                    max="999"
                    placeholder="Sem meta"
                    value={activePart.targetStitches > 0 ? activePart.targetStitches : ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateCurrentPart({ targetStitches: val });
                    }}
                    className="w-12 text-center font-black text-xs text-[#2D2824] dark:text-stone-100 font-mono-numbers bg-transparent focus:outline-none"
                    title="Quantidade total de pontos que a receita pede nesta volta"
                  />
                  <span className="text-[10px] font-semibold text-stone-400">pts</span>
                </div>

                <button
                  onClick={handleResetStitches}
                  disabled={activePart.currentStitch === 0}
                  className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 disabled:opacity-30 flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded-lg hover:bg-[#EAE0D2] dark:hover:bg-stone-700"
                  title="Zerar pontos contados nesta volta (não altera o cronômetro)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="font-semibold">Zerar pts</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-[#F0E8DC] dark:bg-stone-800 p-2.5 rounded-2xl border border-[#D6C8B8] dark:border-stone-700">
              <button
                onClick={handleDecrementStitch}
                disabled={activePart.currentStitch <= 0}
                className="w-11 h-10 rounded-xl bg-white dark:bg-stone-700 border border-[#D6C8B8] dark:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center justify-center disabled:opacity-30 hover:bg-[#F8F4EC] dark:hover:bg-stone-600 transition-transform active:scale-95 cursor-pointer shadow-xs"
                title="Diminuir 1 ponto"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1 font-mono-numbers">
                  <span className="text-2xl sm:text-3xl font-black text-[#2D2824] dark:text-stone-100">
                    {activePart.currentStitch}
                  </span>
                  {activePart.targetStitches > 0 && (
                    <span className="text-base sm:text-lg font-bold text-stone-400 dark:text-stone-500">
                      / {activePart.targetStitches}
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold">
                  {activePart.targetStitches > 0 ? (
                    activePart.currentStitch >= activePart.targetStitches ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Volta completa!</span>
                    ) : (
                      <span className="text-stone-500 dark:text-stone-400 font-medium">
                        falta(m) {activePart.targetStitches - activePart.currentStitch} pts
                      </span>
                    )
                  ) : (
                    <span className="text-stone-500 dark:text-stone-400 font-medium">pontos feitos</span>
                  )}
                </span>
              </div>

              <button
                onClick={handleIncrementStitch}
                disabled={activePart.targetStitches > 0 && activePart.currentStitch >= activePart.targetStitches && !settings.autoAdvanceRound}
                className={`w-14 h-10 rounded-xl font-bold flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer ${
                  activePart.targetStitches > 0 && activePart.currentStitch >= activePart.targetStitches && !settings.autoAdvanceRound
                    ? 'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-50'
                    : 'bg-[#8C5E47] hover:bg-[#724A36] text-white'
                }`}
                title={
                  activePart.targetStitches > 0 && activePart.currentStitch >= activePart.targetStitches
                    ? 'Volta completa! Avance para a próxima volta (+1 Volta)'
                    : 'Aumentar 1 ponto'
                }
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            </div>

            {/* Quick stitch preset chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
              <span className="text-[10px] text-stone-500 font-medium mr-0.5">Pontos comuns:</span>
              {[6, 12, 18, 24, 30, 36, 42].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateCurrentPart({ targetStitches: num })}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    activePart.targetStitches === num
                      ? 'bg-[#8C5E47] text-white shadow-xs'
                      : 'bg-[#EDE4D6] hover:bg-[#E2D6C5] dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                  title={`Definir meta de ${num} pontos nesta volta`}
                >
                  {num}
                </button>
              ))}
              {activePart.targetStitches > 0 && (
                <button
                  type="button"
                  onClick={() => updateCurrentPart({ targetStitches: 0 })}
                  className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline ml-auto cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Clean Quick Tools Bar */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <button
          onClick={onOpenColorModal}
          className="py-2.5 px-2 rounded-2xl bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-pink-300 text-stone-700 dark:text-stone-300 font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <Palette className="w-4 h-4 text-pink-500 shrink-0" />
          <span className="truncate">Trocas de Cor</span>
          {activePart.colorReminders?.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 text-[9px] flex items-center justify-center shrink-0">
              {activePart.colorReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenPartsModal}
          className="py-2.5 px-2 rounded-2xl bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-amber-400 text-stone-700 dark:text-stone-300 font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <Layers className="w-4 h-4 text-[#8C5E47] shrink-0" />
          <span className="truncate">Peças ({project.parts.length})</span>
        </button>

        <button
          onClick={onOpenPdfModal}
          className="py-2.5 px-2 rounded-2xl bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:bg-[#EFE8DC] text-[#6F442F] dark:text-amber-200 font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
        >
          <FileText className="w-4 h-4 text-[#8C5E47] dark:text-amber-400 shrink-0" />
          <span className="truncate">Receita PDF</span>
        </button>
      </div>

      {/* Jump to Round Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-800 rounded-3xl max-w-xs w-full p-5 shadow-2xl">
            <h4 className="font-extrabold text-base text-[#2D2824] dark:text-stone-100 mb-2 font-comfortaa">
              Ir para Volta Específica
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Digite o número da volta para pular diretamente:
            </p>
            <form onSubmit={handleJumpToRound} className="space-y-3">
              <input
                type="number"
                min="1"
                max="999"
                placeholder="Ex: 18"
                value={jumpRoundInput}
                onChange={(e) => setJumpRoundInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-900 text-[#2D2824] dark:text-stone-100 font-mono-numbers text-center text-xl font-bold focus:ring-2 focus:ring-[#8C5E47] focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJumpModal(false)}
                  className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl craft-btn-primary text-white text-xs font-bold shadow-md cursor-pointer"
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
