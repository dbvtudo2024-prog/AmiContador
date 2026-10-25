import React from 'react';
import {
  Sparkles,
  Calculator,
  Hash,
  BookOpen,
  Package,
  FileText,
  Play,
  ArrowRight,
  Clock,
  Layers,
  Mic,
  ChevronRight,
} from 'lucide-react';
import { AmigurumiProject, QuickCounter } from '../types/amigurumi';
import { PWAInstallButton } from './PWAInstallButton';
import { formatTime } from './ProjectStopwatch';

interface HomeHubViewProps {
  currentProject: AmigurumiProject | null;
  quickCounter: QuickCounter;
  onNavigateToCounter: () => void;
  onOpenCalculator: () => void;
  onOpenDictionary: () => void;
  onOpenYarnStash: () => void;
  onOpenPdf: () => void;
  onOpenProjectsList: () => void;
}

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  currentProject,
  quickCounter,
  onNavigateToCounter,
  onOpenCalculator,
  onOpenDictionary,
  onOpenYarnStash,
  onOpenPdf,
  onOpenProjectsList,
}) => {
  const activePart = currentProject
    ? currentProject.parts.find((p) => p.id === currentProject.activePartId) || currentProject.parts[0]
    : null;

  const currentRound = activePart ? activePart.currentRound : quickCounter.currentRound;
  const currentStitch = activePart ? activePart.currentStitch : quickCounter.currentStitch;
  const totalSeconds = currentProject?.totalTimeSeconds || quickCounter.totalTimeSeconds || 0;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 pb-20 animate-fade-in px-3 pt-2">
      {/* 1. Welcoming Hero Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#FAF5ED] to-[#F2E8DC] dark:from-stone-900 dark:to-stone-850 border border-[#D6C8B8] dark:border-stone-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#8C5E47] text-white flex items-center justify-center text-2xl shadow-md shrink-0">
            <span>🧶</span>
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8C5E47] dark:text-amber-400 font-comfortaa">
              Ateliê de Amigurumi
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#2D2824] dark:text-stone-100 font-comfortaa leading-tight">
              AmiContador
            </h2>
          </div>
        </div>
        <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
          Seu assistente completo para crochetar: contador inteligente, receitas em PDF, precificação e controle de fios.
        </p>

        {/* PWA Install Promotion Banner */}
        <div className="mt-3">
          <PWAInstallButton variant="card" />
        </div>
      </div>

      {/* 2. Quick Resume / Active Project Card (if currently working on something) */}
      {(currentProject || quickCounter.currentRound > 1 || quickCounter.currentStitch > 0) && (
        <div
          onClick={onNavigateToCounter}
          className="p-4 rounded-3xl bg-[#FFF6EE] dark:bg-stone-900 border-2 border-[#F4A261] shadow-md flex items-center justify-between gap-3 cursor-pointer hover:border-[#C85A32] transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#C85A32] text-white flex items-center justify-center shadow-xs shrink-0">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A32] block">
                Continuar de onde parou
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-[#2D2824] dark:text-stone-100 truncate font-comfortaa">
                {currentProject ? currentProject.title : 'Contador Livre'}
              </h4>
              <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                <span>Volta <strong>{currentRound}</strong></span>
                <span>•</span>
                <span>{currentStitch} pts</span>
                {totalSeconds > 0 && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 font-mono text-[11px]">
                      <Clock className="w-3 h-3" /> {formatTime(totalSeconds)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-[#FAF5ED] dark:bg-stone-800 flex items-center justify-center text-[#C85A32] shrink-0 shadow-2xs">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 3. Main Navigation Grid: Contador de Pontos & Calculadora de Precificação */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1 font-comfortaa">
          O que deseja fazer agora?
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: Contador de Pontos */}
          <button
            onClick={onNavigateToCounter}
            className="p-4 rounded-3xl bg-white dark:bg-stone-800 border-2 border-[#8C5E47] hover:bg-[#FAF5ED] dark:hover:bg-stone-750 text-left shadow-sm transition-all cursor-pointer flex flex-col justify-between h-36 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-11 h-11 rounded-2xl bg-[#8C5E47] text-white flex items-center justify-center shadow-xs">
                <Hash className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-[#8C5E47] dark:text-amber-400 bg-[#EDE4D6] dark:bg-stone-700 px-2.5 py-1 rounded-full group-hover:bg-[#8C5E47] group-hover:text-white transition-colors">
                Abrir Contador
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#2D2824] dark:text-stone-100 font-comfortaa leading-tight">
                Contador de Pontos
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                Controle voltas, pontos, cronômetro e trocas de cor da sua receita.
              </p>
            </div>
          </button>

          {/* Card 2: Calculadora de Precificação */}
          <button
            onClick={onOpenCalculator}
            className="p-4 rounded-3xl bg-white dark:bg-stone-800 border-2 border-[#C85A32] hover:bg-[#FAF5ED] dark:hover:bg-stone-750 text-left shadow-sm transition-all cursor-pointer flex flex-col justify-between h-36 group relative overflow-hidden"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-11 h-11 rounded-2xl bg-[#C85A32] text-white flex items-center justify-center shadow-xs">
                <Calculator className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[11px] font-bold text-[#C85A32] dark:text-amber-400 bg-[#FFF0E6] dark:bg-stone-700 px-2.5 py-1 rounded-full group-hover:bg-[#C85A32] group-hover:text-white transition-colors">
                Calcular Preço
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-base text-[#2D2824] dark:text-stone-100 font-comfortaa leading-tight">
                Calculadora de Preço
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                Calcule o valor exato da sua peça com horas tecidas, materiais e margem de lucro.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Secondary Craft Tools Row */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1 font-comfortaa">
          Ferramentas do Ateliê
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Tool 1: Dicionário & Tradutor */}
          <button
            onClick={onOpenDictionary}
            className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-[#8C5E47] text-left transition-all cursor-pointer shadow-2xs flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EDE4D6] dark:bg-stone-700 text-[#8C5E47] dark:text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-[#2D2824] dark:text-stone-100 truncate">
                Dicionário & Tradutor
              </h4>
              <p className="text-[10px] text-stone-500 truncate">
                US/ES para Português
              </p>
            </div>
          </button>

          {/* Tool 2: Armarinho de Fios */}
          <button
            onClick={onOpenYarnStash}
            className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-[#8C5E47] text-left transition-all cursor-pointer shadow-2xs flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EDE4D6] dark:bg-stone-700 text-[#8C5E47] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-[#2D2824] dark:text-stone-100 truncate">
                Meu Armarinho
              </h4>
              <p className="text-[10px] text-stone-500 truncate">
                Estoque de fios e lotes
              </p>
            </div>
          </button>

          {/* Tool 3: Receitas em PDF */}
          <button
            onClick={onOpenPdf}
            className="p-3.5 rounded-2xl bg-white dark:bg-stone-800 border border-[#D6C8B8] dark:border-stone-700 hover:border-[#8C5E47] text-left transition-all cursor-pointer shadow-2xs flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-[#EDE4D6] dark:bg-stone-700 text-[#8C5E47] dark:text-amber-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-[#2D2824] dark:text-stone-100 truncate">
                Receita em PDF
              </h4>
              <p className="text-[10px] text-stone-500 truncate">
                Ler com contador sobreposto
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
