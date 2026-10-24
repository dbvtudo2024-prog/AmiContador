import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { QuickCounter, AppSettings, ColorReminder } from '../types/amigurumi';
import { soundEffects } from '../services/audio';
import {
  Plus,
  Minus,
  RotateCcw,
  Palette,
  Sparkles,
  Hash,
  FileText,
  BellRing,
  BookmarkPlus,
  ChevronRight,
  Target,
  Trophy,
} from 'lucide-react';

interface FreeCounterViewProps {
  counter: QuickCounter;
  settings: AppSettings;
  onUpdateCounter: (updated: QuickCounter) => void;
  onResetCounter: () => void;
  onSaveAsProject: (title: string) => void;
  onOpenColorModal: () => void;
  onOpenPdfModal: () => void;
  onTriggerColorAlert: (reminder: ColorReminder, contextName: string) => void;
}

export const FreeCounterView: React.FC<FreeCounterViewProps> = ({
  counter,
  settings,
  onUpdateCounter,
  onResetCounter,
  onSaveAsProject,
  onOpenColorModal,
  onOpenPdfModal,
  onTriggerColorAlert,
}) => {
  const [jumpRoundInput, setJumpRoundInput] = useState('');
  const [showJumpModal, setShowJumpModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectTitleInput, setProjectTitleInput] = useState('');

  // Active color reminder for this round
  const currentColorReminder = counter.colorReminders?.find(
    (r) => r.round === counter.currentRound
  );

  // Next upcoming color reminder
  const nextColorReminder = counter.colorReminders
    ?.filter((r) => r.round > counter.currentRound)
    ?.sort((a, b) => a.round - b.round)[0];

  // Check color change alert
  const checkColorAlert = useCallback(
    (roundNum: number) => {
      const match = counter.colorReminders?.find((r) => r.round === roundNum);
      if (match) {
        soundEffects.playColorChangeAlert(settings.soundEnabled, settings.soundVolume);
        soundEffects.vibrate([100, 50, 100], settings.vibrationEnabled);
        onTriggerColorAlert(match, 'Contador Livre');
      }
    },
    [counter.colorReminders, settings, onTriggerColorAlert]
  );

  // Check victory if reaching target rounds
  const checkVictory = useCallback(
    (roundNum: number) => {
      if (counter.targetRounds > 0 && roundNum === counter.targetRounds) {
        soundEffects.playVictorySound(settings.soundEnabled, settings.soundVolume);
        soundEffects.vibrate([100, 50, 100, 50, 200], settings.vibrationEnabled);
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6'],
          });
        } catch {}
      }
    },
    [counter.targetRounds, settings]
  );

  // Increment Round
  const handleIncrementRound = useCallback(() => {
    const nextRound = counter.currentRound + 1;
    soundEffects.playRoundChime(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(60, settings.vibrationEnabled);

    onUpdateCounter({
      ...counter,
      currentRound: nextRound,
      currentStitch: 0,
    });

    checkColorAlert(nextRound);
    checkVictory(nextRound);
  }, [counter, settings, onUpdateCounter, checkColorAlert, checkVictory]);

  // Decrement Round
  const handleDecrementRound = useCallback(() => {
    if (counter.currentRound <= 1) return;
    const prevRound = counter.currentRound - 1;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(30, settings.vibrationEnabled);

    onUpdateCounter({
      ...counter,
      currentRound: prevRound,
      currentStitch: 0,
    });
  }, [counter, settings, onUpdateCounter]);

  // Increment Stitch
  const handleIncrementStitch = useCallback(() => {
    const nextStitch = counter.currentStitch + 1;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(25, settings.vibrationEnabled);

    if (
      settings.autoAdvanceRound &&
      counter.targetStitches > 0 &&
      nextStitch >= counter.targetStitches
    ) {
      handleIncrementRound();
    } else {
      onUpdateCounter({ ...counter, currentStitch: nextStitch });
    }
  }, [counter, settings, onUpdateCounter, handleIncrementRound]);

  // Decrement Stitch
  const handleDecrementStitch = useCallback(() => {
    if (counter.currentStitch <= 0) return;
    soundEffects.playStitchClick(settings.soundEnabled, settings.soundVolume);
    soundEffects.vibrate(20, settings.vibrationEnabled);
    onUpdateCounter({ ...counter, currentStitch: counter.currentStitch - 1 });
  }, [counter, settings, onUpdateCounter]);

  // Reset Stitches in current round
  const handleResetStitches = () => {
    onUpdateCounter({ ...counter, currentStitch: 0 });
    soundEffects.vibrate(40, settings.vibrationEnabled);
  };

  // Jump to specific round
  const handleJumpToRound = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpRoundInput);
    if (!isNaN(target) && target >= 1) {
      onUpdateCounter({ ...counter, currentRound: target, currentStitch: 0 });
      checkColorAlert(target);
      checkVictory(target);
    }
    setShowJumpModal(false);
    setJumpRoundInput('');
  };

  // Handle Save As Project
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitleInput.trim()) return;
    onSaveAsProject(projectTitleInput.trim());
    setShowSaveModal(false);
    setProjectTitleInput('');
  };

  // Calculate percentage if target rounds is set
  const progressPercent =
    counter.targetRounds > 0
      ? Math.min(100, Math.round((counter.currentRound / counter.targetRounds) * 100))
      : null;

  const isCompleted = counter.targetRounds > 0 && counter.currentRound >= counter.targetRounds;

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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-20 animate-fade-in">
      {/* 1. Header Toolbar for Free Counter */}
      <div className="flex items-center justify-between gap-2 bg-white dark:bg-stone-800/80 p-3 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold text-xs text-stone-800 dark:text-stone-200 font-comfortaa">
            Contador Livre
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Salvar como projeto no banco de dados"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-amber-500" />
            <span>Salvar como Projeto</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja zerar o contador de voltas e pontos?')) {
                onResetCounter();
              }
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            title="Zerar Contador"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. THE TOTAL ROUNDS INPUT FIELD (Campo onde coloca quantas voltas tem) */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 border-2 border-amber-300 dark:border-amber-700 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <label htmlFor="total-rounds-input" className="block text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Quantas voltas tem a peça?
              </label>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Coloque o total aqui e vá apenas clicando para passar as voltas!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="total-rounds-input"
              type="number"
              min="0"
              max="999"
              placeholder="Ex: 36"
              value={counter.targetRounds > 0 ? counter.targetRounds : ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                onUpdateCounter({
                  ...counter,
                  targetRounds: isNaN(val) || val < 0 ? 0 : val,
                });
              }}
              className="w-24 px-3 py-2 text-center text-lg font-black text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 border-2 border-amber-400 dark:border-amber-600 rounded-2xl shadow-inner font-mono-numbers focus:ring-4 focus:ring-amber-400/30 focus:outline-none"
            />
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">voltas</span>
          </div>
        </div>

        {/* Quick round chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-200/60 dark:border-stone-700">
          <span className="text-[10px] font-bold text-stone-400 mr-1">Atalhos rápidos:</span>
          {[12, 18, 24, 30, 36, 42, 50].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onUpdateCounter({ ...counter, targetRounds: num })}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                counter.targetRounds === num
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white/80 dark:bg-stone-800 hover:bg-amber-100 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
              }`}
            >
              {num}
            </button>
          ))}
          {counter.targetRounds > 0 && (
            <button
              type="button"
              onClick={() => onUpdateCounter({ ...counter, targetRounds: 0 })}
              className="text-[10px] text-stone-400 hover:text-stone-600 underline ml-auto cursor-pointer"
            >
              Sem meta
            </button>
          )}
        </div>
      </div>

      {/* 3. Color Change Reminder Card (if active on current round) */}
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
        <div
          onClick={onOpenColorModal}
          className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-pink-500" />
            Adicionar lembretes de troca de cor
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">+ Adicionar</span>
        </div>
      )}

      {/* 4. MAIN ROUND COUNTER BOX */}
      <div className="p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-200/90 dark:border-stone-700 shadow-xl shadow-stone-200/40 dark:shadow-none space-y-5 relative overflow-hidden">
        {/* Top bar inside counter */}
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-700 pb-3">
          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl">
                <Trophy className="w-4 h-4" /> Todas as voltas concluídas!
              </span>
            ) : counter.targetRounds > 0 ? (
              <span className="text-xs font-bold text-stone-600 dark:text-stone-300">
                Volta <strong>{counter.currentRound}</strong> de {counter.targetRounds}
              </span>
            ) : (
              <span className="text-xs font-medium text-stone-400">
                Modo Livre (sem limite de voltas)
              </span>
            )}
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

        {/* Big Display */}
        <div className="text-center py-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
            VOLTA ATUAL
          </span>
          <div className="flex items-baseline justify-center gap-2 mt-1">
            <span className="text-7xl sm:text-8xl font-black text-stone-900 dark:text-stone-50 font-mono-numbers tracking-tight">
              {counter.currentRound}
            </span>
            {counter.targetRounds > 0 && (
              <span className="text-2xl sm:text-3xl font-bold text-stone-400 dark:text-stone-500 font-mono-numbers">
                / {counter.targetRounds}
              </span>
            )}
          </div>

          {/* Smooth progress bar if target is set */}
          {counter.targetRounds > 0 && (
            <div className="mt-3">
              <div className="w-full max-w-md mx-auto bg-stone-100 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-stone-400 mt-1 block">
                {progressPercent}% concluído ({counter.currentRound} de {counter.targetRounds} voltas)
              </span>
            </div>
          )}
        </div>

        {/* Big Tactile Buttons for Passing Rounds */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <button
            onClick={handleDecrementRound}
            disabled={counter.currentRound <= 1}
            className="py-5 px-3 rounded-2xl bg-stone-100 dark:bg-stone-700/80 hover:bg-stone-200 dark:hover:bg-stone-600 disabled:opacity-40 text-stone-800 dark:text-stone-200 font-extrabold text-sm flex flex-col items-center justify-center gap-1 tactile-btn cursor-pointer shadow-xs border border-stone-200/60 dark:border-stone-600"
          >
            <Minus className="w-6 h-6 stroke-[3]" />
            <span className="text-[11px] font-black uppercase tracking-wider">-1 Volta</span>
          </button>

          {/* Giant +1 Volta Button: The main button you just keep pressing! */}
          <button
            onClick={handleIncrementRound}
            className="col-span-2 py-5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-lg flex items-center justify-center gap-3 tactile-btn shadow-lg shadow-amber-500/30 cursor-pointer active:scale-95"
          >
            <Plus className="w-7 h-7 stroke-[3.5]" />
            <div className="text-left">
              <span className="block text-xl leading-tight font-comfortaa">+1 VOLTA</span>
              <span className="block text-[11px] font-bold text-amber-100 tracking-wider uppercase">
                {counter.targetRounds > 0
                  ? `Passar para volta ${counter.currentRound + 1} de ${counter.targetRounds}`
                  : 'Próxima Volta'}
              </span>
            </div>
          </button>
        </div>

        {/* 5. Stitch Counter */}
        {settings.showStitchCounter && (
          <div className="pt-4 border-t border-stone-100 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pontos feitos nesta volta
              </span>
              <button
                onClick={handleResetStitches}
                disabled={counter.currentStitch === 0}
                className="text-[11px] font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Zerar pontos
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200 dark:border-stone-700">
              <button
                onClick={handleDecrementStitch}
                disabled={counter.currentStitch <= 0}
                className="w-12 h-12 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 flex items-center justify-center disabled:opacity-30 hover:bg-stone-100 dark:hover:bg-stone-700 tactile-btn cursor-pointer"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="text-center">
                <span className="text-3xl font-black text-stone-800 dark:text-stone-100 font-mono-numbers">
                  {counter.currentStitch}
                </span>
                <span className="block text-[10px] text-stone-400 font-medium">pontos</span>
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

      {/* 6. Tools Bar */}
      <div className="grid grid-cols-2 gap-2 px-1 text-xs">
        <button
          onClick={onOpenColorModal}
          className="py-3 px-3 rounded-2xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-pink-300 text-stone-700 dark:text-stone-300 font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <Palette className="w-4 h-4 text-pink-500" />
          <span>Lembretes de Cor</span>
          {counter.colorReminders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 text-[10px] flex items-center justify-center">
              {counter.colorReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenPdfModal}
          className="py-3 px-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-amber-900 dark:text-amber-200 font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Receita em PDF</span>
        </button>
      </div>

      {/* Save as Project Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl">
            <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 mb-2 font-comfortaa">
              Salvar como Projeto
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Dê um nome para este amigurumi para salvá-lo no seu banco de dados:
            </p>
            <form onSubmit={handleSaveSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Ex: Ursinho, Polvinho, Cacto..."
                value={projectTitleInput}
                onChange={(e) => setProjectTitleInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                autoFocus
                required
              />
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Jump to Round Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xs w-full p-5 shadow-2xl">
            <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 mb-2 font-comfortaa">
              Ir para Volta Específica
            </h4>
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
