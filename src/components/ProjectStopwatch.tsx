import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, TimerReset, Clock, Check, X } from 'lucide-react';
import { soundEffects } from '../services/audio';

interface ProjectStopwatchProps {
  totalSeconds: number;
  isRunning?: boolean;
  onUpdateSeconds: (newSeconds: number) => void;
  onToggleRunning?: (isRunning: boolean) => void;
  compact?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ProjectStopwatch: React.FC<ProjectStopwatchProps> = ({
  totalSeconds,
  isRunning = false,
  onUpdateSeconds,
  onToggleRunning,
  compact = false,
  soundEnabled = true,
  vibrationEnabled = true,
}) => {
  const [localRunning, setLocalRunning] = useState<boolean>(isRunning);
  const [localSeconds, setLocalSeconds] = useState<number>(totalSeconds || 0);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  // Maintain refs to avoid stale closures and avoid calling parent setStates inside render/updaters
  const secondsRef = useRef<number>(totalSeconds || 0);
  const onUpdateSecondsRef = useRef(onUpdateSeconds);
  const onToggleRunningRef = useRef(onToggleRunning);

  useEffect(() => {
    onUpdateSecondsRef.current = onUpdateSeconds;
  }, [onUpdateSeconds]);

  useEffect(() => {
    onToggleRunningRef.current = onToggleRunning;
  }, [onToggleRunning]);

  // Sync internal state when parent props change
  useEffect(() => {
    secondsRef.current = totalSeconds || 0;
    setLocalSeconds(totalSeconds || 0);
  }, [totalSeconds]);

  useEffect(() => {
    setLocalRunning(isRunning);
  }, [isRunning]);

  // Interval timer tick
  useEffect(() => {
    if (!localRunning) return;

    const interval = setInterval(() => {
      const next = secondsRef.current + 1;
      secondsRef.current = next;
      setLocalSeconds(next);
      onUpdateSecondsRef.current(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [localRunning]);

  // Auto-dismiss confirmation after 6 seconds if not clicked
  useEffect(() => {
    if (!showConfirmReset) return;
    const timer = setTimeout(() => {
      setShowConfirmReset(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [showConfirmReset]);

  const handleToggle = () => {
    const nextRunning = !localRunning;
    setLocalRunning(nextRunning);
    if (onToggleRunningRef.current) {
      onToggleRunningRef.current(nextRunning);
    }
    soundEffects.vibrate(20, vibrationEnabled);
  };

  const handleConfirmReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    secondsRef.current = 0;
    setLocalSeconds(0);
    setLocalRunning(false);
    setShowConfirmReset(false);
    onUpdateSecondsRef.current(0);
    if (onToggleRunningRef.current) {
      onToggleRunningRef.current(false);
    }
    soundEffects.playStitchClick(soundEnabled, 0.6);
    soundEffects.vibrate(40, vibrationEnabled);
  };

  const handleCancelReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirmReset(false);
  };

  if (compact) {
    return (
      <div className="relative overflow-hidden flex items-center gap-1.5 bg-[#FAF5ED] dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 px-2.5 py-1 rounded-xl text-xs shadow-2xs">
        <Clock className={`w-3.5 h-3.5 ${localRunning ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-stone-400'}`} />
        <span className="font-mono font-bold text-stone-700 dark:text-stone-200">
          {formatTime(localSeconds)}
        </span>
        <button
          onClick={handleToggle}
          className={`p-1 rounded-lg text-xs cursor-pointer transition-colors ${
            localRunning
              ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
              : 'bg-[#EDE4D6] hover:bg-[#E2D6C5] dark:bg-stone-700 text-stone-700 dark:text-stone-200'
          }`}
          title={localRunning ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
        >
          {localRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
        </button>

        {localSeconds > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirmReset(true);
            }}
            className="p-1 rounded-lg text-stone-400 hover:text-[#C85A32] hover:bg-[#EDE4D6] dark:hover:bg-stone-700 transition-colors cursor-pointer"
            title="Zerar tempo do cronômetro"
          >
            <TimerReset className="w-3 h-3" />
          </button>
        )}

        {/* Compact Blurred Overlay */}
        {showConfirmReset && (
          <div className="absolute inset-0 bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-sm z-10 flex items-center justify-between px-2 gap-1 rounded-xl animate-fade-in">
            <span className="text-[10px] font-bold text-[#8C5E47] dark:text-amber-300">
              Zerar?
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleConfirmReset}
                className="px-1.5 py-0.5 rounded-md bg-[#C85A32] text-white text-[10px] font-bold cursor-pointer"
              >
                Sim
              </button>
              <button
                onClick={handleCancelReset}
                className="p-0.5 text-stone-400 hover:text-stone-600 text-[10px] cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#FAF5ED] dark:bg-stone-800/80 p-2.5 sm:p-3 rounded-2xl border border-[#D6C8B8] dark:border-stone-700 shadow-2xs">
      {/* Main Stopwatch Content */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            localRunning ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-[#EDE4D6] dark:bg-stone-700 text-stone-500'
          }`}>
            <Clock className={`w-4 h-4 ${localRunning ? 'animate-pulse' : ''}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider font-comfortaa">
                Tempo do Projeto
              </span>
              {localRunning && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
            <span className="text-base sm:text-lg font-mono font-black text-[#2D2824] dark:text-stone-100 block">
              {formatTime(localSeconds)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Play / Pause Primary Button */}
          <button
            type="button"
            onClick={handleToggle}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer ${
              localRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-[#8C5E47] hover:bg-[#724A36] text-white shadow-xs'
            }`}
          >
            {localRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{localSeconds > 0 ? 'Continuar' : 'Iniciar'}</span>
              </>
            )}
          </button>

          {/* Distinctive Stopwatch Reset Button */}
          {localSeconds > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmReset(true);
              }}
              className="px-2 sm:px-2.5 py-1.5 rounded-xl border border-[#D6C8B8] dark:border-stone-700 bg-[#FAF5ED] hover:bg-[#F0E6D8] dark:bg-stone-800 dark:hover:bg-stone-700 text-[#6D5E52] dark:text-stone-300 hover:text-[#C85A32] flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Zerar cronômetro de tempo (não altera as voltas ou pontos)"
            >
              <TimerReset className="w-3.5 h-3.5 text-[#C85A32]" />
              <span className="text-[11px] hidden sm:inline">Zerar tempo</span>
            </button>
          )}
        </div>
      </div>

      {/* Blurred Backdrop Overlay Covering the Entire Stopwatch Card when Confirming Reset */}
      {showConfirmReset && (
        <div className="absolute inset-0 bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-md z-20 flex items-center justify-between px-3 sm:px-4 py-2 gap-2 rounded-2xl border-2 border-[#E76F51]/60 shadow-md animate-fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#C85A32]/15 text-[#C85A32] flex items-center justify-center shrink-0">
              <TimerReset className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-[#2D2824] dark:text-stone-100 font-comfortaa block truncate">
                Zerar o tempo do cronômetro?
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 block truncate">
                O tempo voltará para 00:00 (pontos mantidos)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleConfirmReset}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#C85A32] hover:bg-[#B24822] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1 active:scale-95"
              title="Confirmar zerar tempo"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Sim, zerar</span>
            </button>
            <button
              type="button"
              onClick={handleCancelReset}
              className="p-1.5 rounded-xl bg-[#EDE4D6] hover:bg-[#E0D4C2] dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold cursor-pointer transition-colors"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
