import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { QuickCounter, AppSettings, ColorReminder } from '../types/amigurumi';
import { soundEffects } from '../services/audio';
import {
  Plus,
  Minus,
  RotateCcw,
  Palette,
  Hash,
  FileText,
  BellRing,
  BookmarkPlus,
  ChevronRight,
  Target,
  Trophy,
  Check,
  Pencil,
  Sparkles,
} from 'lucide-react';

interface FreeCounterViewProps {
  counter: QuickCounter;
  settings: AppSettings;
  onUpdateCounter: (updated: QuickCounter) => void;
  onResetCounter: () => void;
  onSaveAsProject: (title: string, partName?: string) => void;
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
  const [partNameInput, setPartNameInput] = useState('');

  // Target rounds collapsed state: collapses when user confirms to keep the "+1 VOLTA" button high up on mobile!
  const [isTargetCollapsed, setIsTargetCollapsed] = useState<boolean>(counter.targetRounds > 0);
  const [targetInputValue, setTargetInputValue] = useState<string>(
    counter.targetRounds > 0 ? String(counter.targetRounds) : ''
  );

  // Sync internal input value if counter changes from outside
  useEffect(() => {
    if (counter.targetRounds > 0) {
      setTargetInputValue(String(counter.targetRounds));
    }
  }, [counter.targetRounds]);

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
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#C85A32', '#81B29A', '#D97706', '#E76F51', '#2A9D8F'],
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
    // If target is set and already completed: do not count further!
    if (counter.targetStitches > 0 && counter.currentStitch >= counter.targetStitches) {
      if (settings.autoAdvanceRound) {
        handleIncrementRound();
      }
      return;
    }

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
      const cappedStitch = counter.targetStitches > 0 ? Math.min(nextStitch, counter.targetStitches) : nextStitch;
      onUpdateCounter({ ...counter, currentStitch: cappedStitch });
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

  // Confirm target rounds & collapse the section to pull buttons high up
  const handleConfirmTarget = (num?: number) => {
    const parsed = num !== undefined ? num : parseInt(targetInputValue);
    const valid = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    onUpdateCounter({ ...counter, targetRounds: valid });
    setTargetInputValue(valid > 0 ? String(valid) : '');
    setIsTargetCollapsed(true);
  };

  // Handle Save As Project
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitleInput.trim()) return;
    onSaveAsProject(projectTitleInput.trim(), partNameInput.trim() || undefined);
    setShowSaveModal(false);
    setProjectTitleInput('');
    setPartNameInput('');
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
    <div className="w-full max-w-xl mx-auto space-y-2.5 sm:space-y-3.5 pb-16 animate-fade-in">
      {/* 1. Slim Top Bar: Mode indicator, Save & Reset buttons (takes zero wasted height!) */}
      <div className="flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C85A32]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
          </div>
          <span className="font-comfortaa text-sm sm:text-base font-extrabold text-[#2D2824] dark:text-stone-100 tracking-tight">
            Contador Livre
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#FAF5ED] hover:bg-[#F2ECE1] dark:bg-stone-800 text-[#2D2824] dark:text-stone-100 border border-[#D6C8B8] dark:border-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Salvar contador atual como um projeto individual"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Salvar</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Deseja zerar as voltas e pontos?')) {
                onResetCounter();
              }
            }}
            className="p-1.5 rounded-xl text-[#6D5E52] hover:text-[#2D2824] dark:text-stone-300 dark:hover:text-stone-100 hover:bg-[#FAF5ED] dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Zerar Contador"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC COLLAPSIBLE TARGET ROUNDS SECTION */}
      {isTargetCollapsed ? (
        /* Collapsed mini-bar: Keeps "+1 VOLTA" button directly above the fold on mobile! */
        <div className="stitched-card rounded-2xl px-3.5 py-2 flex items-center justify-between text-xs transition-all shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Target className="w-4 h-4 text-[#C85A32] shrink-0" />
            <span className="text-[#2D2824] dark:text-stone-200 font-bold truncate">
              {counter.targetRounds > 0 ? (
                <>
                  Meta: <strong className="text-[#C85A32]">{counter.targetRounds} voltas</strong>
                  <span className="text-[11px] text-stone-500 font-normal ml-1">
                    ({counter.currentRound} de {counter.targetRounds})
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
            title="Alterar quantas voltas tem a peça"
          >
            <Pencil className="w-3 h-3" />
            <span>Alterar</span>
          </button>
        </div>
      ) : (
        /* Expanded target input card: Confirming collapses it immediately */
        <div className="stitched-card rounded-3xl p-3.5 sm:p-4.5 space-y-3 transition-all">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#C85A32]/15 text-[#C85A32] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <label htmlFor="total-rounds-field" className="block text-xs font-bold text-[#2D2824] dark:text-stone-200 font-comfortaa">
                  Quantas voltas tem a peça?
                </label>
                <span className="text-[10px] sm:text-[11px] text-stone-500 dark:text-stone-400">
                  Defina o total da receita para acompanhar seu progresso
                </span>
              </div>
            </div>

            {/* Input & Confirm Button */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                id="total-rounds-field"
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
                className="w-20 px-2.5 py-1.5 text-center text-base font-black text-[#2D2824] dark:text-stone-100 bg-white dark:bg-stone-800 border-1.5 border-[#D6C8B8] dark:border-stone-700 rounded-xl font-mono-numbers focus:border-[#C85A32] focus:outline-none"
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

          {/* Quick preset chips */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#EAE0D2] dark:border-stone-700/60">
            <span className="text-[10px] text-stone-500 mr-1 font-medium">Voltas comuns:</span>
            {[12, 18, 24, 30, 36, 42, 48].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleConfirmTarget(num)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  counter.targetRounds === num
                    ? 'bg-[#C85A32] text-white shadow-xs'
                    : 'bg-[#EDE4D6] hover:bg-[#E3D9CA] dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
                title={`Definir ${num} voltas e fechar`}
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

      {/* 3. Color Change Reminder Ribbon (if active on current round) */}
      {currentColorReminder ? (
        <div className="p-3.5 rounded-2xl bg-[#FFF6EE] dark:bg-stone-900 border-2 border-[#F4A261] shadow-md flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl shadow-sm border border-stone-300 shrink-0 flex items-center justify-center"
              style={{ backgroundColor: currentColorReminder.colorHex }}
            >
              <span className="text-white drop-shadow text-xs font-bold">🧶</span>
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
            className="px-2.5 py-1 rounded-xl bg-[#C85A32] hover:bg-[#B24822] text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs"
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

          <span className="text-[#C85A32] font-bold flex items-center text-[11px] shrink-0">
            Ver todas <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      ) : null}

      {/* 4. THE MAIN CROCHET COUNTER CLICKER - Positioned high up without scrolling */}
      <div className="stitched-card rounded-3xl p-4 sm:p-6 shadow-md space-y-4 relative overflow-hidden">
        {/* Top bar inside counter: Jump & Status */}
        <div className="flex items-center justify-between gap-2 border-b border-[#EAE0D2] dark:border-stone-700/60 pb-2.5">
          <div>
            {isCompleted ? (
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" /> Todas as voltas concluídas! 🎉
              </span>
            ) : counter.targetRounds > 0 ? (
              <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Volta <strong>{counter.currentRound}</strong> de {counter.targetRounds}
              </span>
            ) : (
              <span className="text-xs text-stone-500 font-medium">
                Contador Livre (sem meta fixa)
              </span>
            )}
          </div>

          <button
            onClick={() => setShowJumpModal(true)}
            className="p-1 text-stone-500 hover:text-[#C85A32] dark:text-stone-400 hover:bg-[#EDE4D6] dark:hover:bg-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title="Ir para volta específica"
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Pular volta...</span>
          </button>
        </div>

        {/* Big Number Display */}
        <div className="text-center py-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8C5E47] dark:text-amber-400 block font-comfortaa">
            VOLTA ATUAL
          </span>
          <div className="flex items-baseline justify-center gap-2 mt-0.5">
            <span className="text-6xl sm:text-7xl font-black text-[#2D2824] dark:text-stone-50 font-mono-numbers tracking-tight">
              {counter.currentRound}
            </span>
            {counter.targetRounds > 0 && (
              <span className="text-2xl sm:text-3xl font-bold text-stone-400 dark:text-stone-500 font-mono-numbers">
                / {counter.targetRounds}
              </span>
            )}
          </div>

          {/* Smooth progress bar */}
          {counter.targetRounds > 0 && (
            <div className="mt-2.5 max-w-sm mx-auto">
              <div className="w-full bg-[#E5DCD0] dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? 'bg-emerald-600' : 'bg-gradient-to-r from-[#D97706] to-[#C85A32]'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-stone-500 mt-1 block">
                {progressPercent}% concluído
              </span>
            </div>
          )}
        </div>

        {/* Big Tactile Craft Buttons: Directly under thumb, high on screen */}
        <div className="grid grid-cols-3 gap-2.5 pt-0.5">
          <button
            onClick={handleDecrementRound}
            disabled={counter.currentRound <= 1}
            className="py-4 sm:py-5 px-3 rounded-2xl craft-btn-secondary disabled:opacity-40 font-bold text-sm flex flex-col items-center justify-center gap-1 cursor-pointer"
          >
            <Minus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">-1 Volta</span>
          </button>

          {/* Giant Primary +1 Volta Button */}
          <button
            onClick={handleIncrementRound}
            className="col-span-2 py-4 sm:py-5 px-4 rounded-2xl craft-btn-primary font-bold text-lg flex items-center justify-center gap-3 cursor-pointer shadow-md"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
            <div className="text-left">
              <span className="block text-lg sm:text-xl leading-tight font-comfortaa font-bold">+1 VOLTA</span>
              <span className="block text-[10px] sm:text-[11px] text-white/90 tracking-wider font-medium uppercase">
                {counter.targetRounds > 0
                  ? `Ir para volta ${counter.currentRound + 1} de ${counter.targetRounds}`
                  : 'Próxima Volta'}
              </span>
            </div>
          </button>
        </div>

        {/* 5. Stitch Counter with Target Stitches Field */}
        {settings.showStitchCounter && (
          <div className="pt-3 border-t border-[#EAE0D2] dark:border-stone-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5 font-comfortaa">
                <span>🪡</span> Pontos nesta volta
              </span>

              <div className="flex items-center gap-2">
                {/* Field to define total stitches for the round */}
                <div className="flex items-center gap-1 bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 px-2 py-1 rounded-xl shadow-2xs">
                  <label htmlFor="free-target-stitches" className="text-[11px] font-bold text-stone-600 dark:text-stone-400">
                    Total da volta:
                  </label>
                  <input
                    id="free-target-stitches"
                    type="number"
                    min="0"
                    max="999"
                    placeholder="Sem meta"
                    value={counter.targetStitches > 0 ? counter.targetStitches : ''}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      onUpdateCounter({ ...counter, targetStitches: val });
                    }}
                    className="w-12 text-center font-black text-xs text-[#2D2824] dark:text-stone-100 font-mono-numbers bg-transparent focus:outline-none"
                    title="Quantidade total de pontos que a receita pede nesta volta"
                  />
                  <span className="text-[10px] font-semibold text-stone-400">pts</span>
                </div>

                <button
                  onClick={handleResetStitches}
                  disabled={counter.currentStitch === 0}
                  className="text-[11px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Zerar pontos contados"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Zerar</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 bg-[#F0E8DC] dark:bg-stone-800 p-2.5 rounded-2xl border border-[#D6C8B8] dark:border-stone-700">
              <button
                onClick={handleDecrementStitch}
                disabled={counter.currentStitch <= 0}
                className="w-11 h-10 rounded-xl bg-white dark:bg-stone-700 border border-[#D6C8B8] dark:border-stone-600 text-stone-700 dark:text-stone-200 flex items-center justify-center disabled:opacity-30 hover:bg-[#F8F4EC] dark:hover:bg-stone-600 transition-transform active:scale-95 cursor-pointer shadow-xs"
                title="Diminuir 1 ponto"
              >
                <Minus className="w-5 h-5 stroke-[2.5]" />
              </button>

              <div className="text-center">
                <div className="flex items-baseline justify-center gap-1 font-mono-numbers">
                  <span className="text-2xl sm:text-3xl font-black text-[#2D2824] dark:text-stone-100">
                    {counter.currentStitch}
                  </span>
                  {counter.targetStitches > 0 && (
                    <span className="text-base sm:text-lg font-bold text-stone-400 dark:text-stone-500">
                      / {counter.targetStitches}
                    </span>
                  )}
                </div>
                <span className="block text-[10px] font-semibold">
                  {counter.targetStitches > 0 ? (
                    counter.currentStitch >= counter.targetStitches ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓ Volta completa!</span>
                    ) : (
                      <span className="text-stone-500 dark:text-stone-400 font-medium">
                        falta(m) {counter.targetStitches - counter.currentStitch} pts
                      </span>
                    )
                  ) : (
                    <span className="text-stone-500 dark:text-stone-400 font-medium">pontos feitos</span>
                  )}
                </span>
              </div>

              <button
                onClick={handleIncrementStitch}
                disabled={counter.targetStitches > 0 && counter.currentStitch >= counter.targetStitches && !settings.autoAdvanceRound}
                className={`w-14 h-10 rounded-xl font-bold flex items-center justify-center shadow-xs transition-transform active:scale-95 cursor-pointer ${
                  counter.targetStitches > 0 && counter.currentStitch >= counter.targetStitches && !settings.autoAdvanceRound
                    ? 'bg-stone-300 dark:bg-stone-700 text-stone-400 dark:text-stone-500 cursor-not-allowed opacity-50'
                    : 'bg-[#8C5E47] hover:bg-[#724A36] text-white'
                }`}
                title={
                  counter.targetStitches > 0 && counter.currentStitch >= counter.targetStitches
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
                  onClick={() => onUpdateCounter({ ...counter, targetStitches: num })}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    counter.targetStitches === num
                      ? 'bg-[#8C5E47] text-white shadow-xs'
                      : 'bg-[#EDE4D6] hover:bg-[#E2D6C5] dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                  title={`Definir meta de ${num} pontos nesta volta`}
                >
                  {num}
                </button>
              ))}
              {counter.targetStitches > 0 && (
                <button
                  type="button"
                  onClick={() => onUpdateCounter({ ...counter, targetStitches: 0 })}
                  className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline ml-auto cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. Bottom Tools Row (Contextual, clean, non-cluttered) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          onClick={onOpenColorModal}
          className="py-2.5 px-3 rounded-2xl bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-[#C85A32] text-[#4A443E] dark:text-stone-200 font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <Palette className="w-4 h-4 text-[#C85A32]" />
          <span>Troca de Cores</span>
          {counter.colorReminders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#E5DCD0] text-[#8C5E47] text-[10px] font-mono flex items-center justify-center font-bold">
              {counter.colorReminders.length}
            </span>
          )}
        </button>

        <button
          onClick={onOpenPdfModal}
          className="py-2.5 px-3 rounded-2xl bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-[#8C5E47] text-[#4A443E] dark:text-stone-200 font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <FileText className="w-4 h-4 text-[#8C5E47]" />
          <span>Receita em PDF</span>
        </button>
      </div>

      {/* Jump to Round Modal */}
      {showJumpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-800 rounded-3xl max-w-xs w-full p-5 shadow-2xl">
            <h4 className="font-extrabold text-base text-[#2D2824] dark:text-stone-100 mb-1 font-comfortaa">
              Pular para outra Volta
            </h4>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Digite o número da volta para posicionar o contador:
            </p>
            <form onSubmit={handleJumpToRound} className="space-y-3">
              <input
                type="number"
                min="1"
                max="999"
                placeholder="Ex: 12"
                value={jumpRoundInput}
                onChange={(e) => setJumpRoundInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#2D2824] dark:text-stone-100 font-mono-numbers text-center text-2xl font-black focus:ring-2 focus:ring-[#8C5E47] focus:outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJumpModal(false)}
                  className="flex-1 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Pular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Save Project Modal */}
      {showSaveModal && (
        <div
          onClick={() => setShowSaveModal(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5"
          >
            <div className="flex items-start justify-between gap-2 border-b border-[#EAE0D2] dark:border-stone-800 pb-2.5">
              <div>
                <h4 className="font-extrabold text-base text-[#2D2824] dark:text-stone-100 font-comfortaa leading-snug">
                  Salvar como Novo Projeto
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Grave as voltas e lembretes de cor no seu banco de projetos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-[#EDE4D6] dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Fechar"
              >
                <span className="text-lg leading-none font-bold">✕</span>
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-3">
              {/* Field 1: Project Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nome do Projeto / Amigurumi:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ursinho Teddy, Coelhinho..."
                  value={projectTitleInput}
                  onChange={(e) => setProjectTitleInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#2D2824] dark:text-stone-100 text-sm font-semibold focus:border-[#8C5E47] focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Field 2: Optional Part Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300">
                    Nome da Peça:
                  </label>
                  <span className="text-[10px] font-bold text-[#8C5E47] dark:text-amber-400 uppercase tracking-wider bg-[#EDE4D6] dark:bg-stone-800 px-2 py-0.5 rounded-full">
                    Opcional
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Cabeça, Corpo, Braço..."
                  value={partNameInput}
                  onChange={(e) => setPartNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-white dark:bg-stone-800 text-[#2D2824] dark:text-stone-100 text-sm font-semibold focus:border-[#8C5E47] focus:outline-none"
                />

                {/* Quick suggestions chips */}
                <div className="flex items-center gap-1 flex-wrap mt-2">
                  <span className="text-[10px] text-stone-500 mr-0.5">Sugestões:</span>
                  {['Cabeça', 'Corpo', 'Braço', 'Perna', 'Orelha', 'Focinho'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPartNameInput(item)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        partNameInput === item
                          ? 'bg-[#8C5E47] text-white shadow-xs'
                          : 'bg-[#EDE4D6] hover:bg-[#E2D6C5] text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Se não informar, será salva como "Peça Principal".
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#EAE0D2] dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 rounded-xl border border-[#D6C8B8] dark:border-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer hover:bg-[#EDE4D6] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!projectTitleInput.trim()}
                  className="flex-1 py-2 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
