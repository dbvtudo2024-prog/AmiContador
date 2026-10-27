/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AmigurumiProject, AppSettings, ColorReminder, QuickCounter } from './types/amigurumi';
import { StorageService, DEFAULT_SETTINGS } from './services/storage';
import { CounterView } from './components/CounterView';
import { FreeCounterView } from './components/FreeCounterView';
import { ProjectListModal } from './components/ProjectListModal';
import { PartManagerModal } from './components/PartManagerModal';
import { ColorRemindersModal } from './components/ColorRemindersModal';
import { ColorAlertModal } from './components/ColorAlertModal';
import { SyncShareModal } from './components/SyncShareModal';
import { SupabaseModal } from './components/SupabaseModal';
import { SettingsModal } from './components/SettingsModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { MenuDrawerModal } from './components/MenuDrawerModal';
import { FloatingCounterOverlay } from './components/FloatingCounterOverlay';
import { HomeHubView } from './components/HomeHubView';
import { PricingCalculatorModal } from './components/PricingCalculatorModal';
import { CrochetDictionaryModal } from './components/CrochetDictionaryModal';
import { YarnStashModal } from './components/YarnStashModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  FolderOpen,
  Menu,
  Eye,
  Check,
  Sun,
  Moon,
  Home,
  Calculator,
  Hash,
  BookOpen,
  Package,
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<AmigurumiProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('free');
  const [quickCounter, setQuickCounter] = useState<QuickCounter>(StorageService.getQuickCounter());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Navigation: Main Menu Hub vs Stitch Counter View
  const [activeScreen, setActiveScreen] = useState<'home' | 'counter'>('home');

  // Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isPartsOpen, setIsPartsOpen] = useState(false);
  const [isColorsOpen, setIsColorsOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSupabaseOpen, setIsSupabaseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [isYarnStashOpen, setIsYarnStashOpen] = useState(false);

  // Color alert modal
  const [colorAlert, setColorAlert] = useState<{
    isOpen: boolean;
    reminder: ColorReminder | null;
    partName: string;
  }>({
    isOpen: false,
    reminder: null,
    partName: '',
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initial load & URL Hash Sync check (when scanning QR code on phone)
  useEffect(() => {
    const loadedProjects = StorageService.getAllProjects();
    const loadedSettings = StorageService.getSettings();
    const loadedQuick = StorageService.getQuickCounter();

    setProjects(loadedProjects);
    setSettings(loadedSettings);
    setQuickCounter(loadedQuick);

    // Check if URL has incoming shared project from QR Code or link (#project=...)
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#project=')) {
      const payload = window.location.hash.replace('#project=', '');
      const incomingProject = StorageService.decodeFromSharePayload(payload);
      if (incomingProject) {
        const saved = StorageService.saveProject(incomingProject);
        StorageService.setActiveProjectId(saved.id);
        setActiveProjectId(saved.id);
        const updated = StorageService.getAllProjects();
        setProjects(updated);
        showToast(`Projeto "${saved.title}" sincronizado com sucesso!`);
        history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    const savedActiveId = StorageService.getActiveProjectId();
    if (savedActiveId && loadedProjects.some((p) => p.id === savedActiveId)) {
      setActiveProjectId(savedActiveId);
    } else {
      // Default to free counter so app starts completely zerado
      setActiveProjectId('free');
    }
  }, []);

  // Screen Wake Lock API handler
  useEffect(() => {
    let wakeLockSentinel: any = null;

    async function requestWakeLock() {
      if ('wakeLock' in navigator && settings.keepAwake) {
        try {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Wake lock rejected or unsupported
        }
      }
    }

    if (settings.keepAwake) {
      requestWakeLock();
    } else if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => {});
    }

    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [settings.keepAwake]);

  // Synchronize dark class to <html> and <body> for full-app dark mode
  useEffect(() => {
    const isDark = settings.theme === 'dark-crochet';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [settings.theme]);

  // Current active project (or null if in Free Counter mode)
  const isFreeMode = activeProjectId === 'free' || !projects.some((p) => p.id === activeProjectId);
  const currentProject = isFreeMode ? null : projects.find((p) => p.id === activeProjectId) || null;

  // Active part if in project mode
  const currentProjectActivePart = currentProject
    ? currentProject.parts.find((p) => p.id === currentProject.activePartId) || currentProject.parts[0]
    : null;

  // Free counter update handler
  const handleUpdateQuickCounter = (updated: QuickCounter) => {
    setQuickCounter(updated);
    StorageService.saveQuickCounter(updated);
  };

  const handleResetQuickCounter = () => {
    const fresh = StorageService.resetQuickCounter();
    setQuickCounter(fresh);
    showToast('Contador zerado (Volta 1, Ponto 0)!');
  };

  const handleSaveFreeCounterAsProject = (title: string, partName?: string) => {
    const newProject = StorageService.convertQuickCounterToProject(title, quickCounter, partName);
    const updated = StorageService.getAllProjects();
    setProjects(updated);
    setActiveProjectId(newProject.id);
    StorageService.setActiveProjectId(newProject.id);
    const savedPart = newProject.parts[0]?.name || 'Peça Principal';
    showToast(`Projeto "${newProject.title}" (${savedPart}) salvo com sucesso!`);
  };

  // Save changes to current project
  const handleUpdateProject = (updated: AmigurumiProject) => {
    const saved = StorageService.saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
  };

  // Create project automatically from parsed PDF
  const handleCreateProjectFromPdf = (newProject: AmigurumiProject) => {
    const saved = StorageService.saveProject(newProject);
    const updated = StorageService.getAllProjects();
    setProjects(updated);
    setActiveProjectId(saved.id);
    StorageService.setActiveProjectId(saved.id);
    setIsPdfOpen(false);
    setIsSplitMode(true);
    setActiveScreen('counter');
    showToast(`🎉 Projeto "${saved.title}" criado com ${saved.parts.length} peças!`);
  };

  // Overlay Counter Handlers (for mobile split/overlay view over PDF)
  const handleOverlayIncrementRound = () => {
    if (currentProject && currentProjectActivePart) {
      const nextRound = currentProjectActivePart.currentRound + 1;
      const nextStitches = currentProjectActivePart.roundStitches?.[nextRound] || currentProjectActivePart.targetStitches;
      const updatedParts = currentProject.parts.map((p) =>
        p.id === currentProjectActivePart.id
          ? { ...p, currentRound: nextRound, currentStitch: 0, targetStitches: nextStitches }
          : p
      );
      handleUpdateProject({ ...currentProject, parts: updatedParts });
    } else {
      const nextRound = quickCounter.currentRound + 1;
      const updatedHistory = {
        ...(quickCounter.roundHistory || {}),
        [quickCounter.currentRound]: quickCounter.currentStitch,
      };
      const updatedTargets = {
        ...(quickCounter.roundTargets || {}),
        ...(quickCounter.targetStitches > 0 ? { [quickCounter.currentRound]: quickCounter.targetStitches } : {}),
      };
      handleUpdateQuickCounter({
        ...quickCounter,
        currentRound: nextRound,
        currentStitch: updatedHistory[nextRound] ?? 0,
        targetStitches: updatedTargets[nextRound] ?? 0,
        roundHistory: updatedHistory,
        roundTargets: updatedTargets,
      });
    }
  };

  const handleOverlayDecrementRound = () => {
    if (currentProject && currentProjectActivePart) {
      if (currentProjectActivePart.currentRound <= 1) return;
      const prevRound = currentProjectActivePart.currentRound - 1;
      const prevStitches = currentProjectActivePart.roundStitches?.[prevRound] || currentProjectActivePart.targetStitches;
      const updatedParts = currentProject.parts.map((p) =>
        p.id === currentProjectActivePart.id
          ? { ...p, currentRound: prevRound, currentStitch: 0, targetStitches: prevStitches }
          : p
      );
      handleUpdateProject({ ...currentProject, parts: updatedParts });
    } else {
      if (quickCounter.currentRound <= 1) return;
      const prevRound = quickCounter.currentRound - 1;
      const updatedHistory = {
        ...(quickCounter.roundHistory || {}),
        [quickCounter.currentRound]: quickCounter.currentStitch,
      };
      const updatedTargets = {
        ...(quickCounter.roundTargets || {}),
        ...(quickCounter.targetStitches > 0 ? { [quickCounter.currentRound]: quickCounter.targetStitches } : {}),
      };
      handleUpdateQuickCounter({
        ...quickCounter,
        currentRound: prevRound,
        currentStitch: updatedHistory[prevRound] ?? 0,
        targetStitches: updatedTargets[prevRound] ?? 0,
        roundHistory: updatedHistory,
        roundTargets: updatedTargets,
      });
    }
  };

  const handleOverlayIncrementStitch = () => {
    if (currentProject && currentProjectActivePart) {
      if (
        currentProjectActivePart.targetStitches > 0 &&
        currentProjectActivePart.currentStitch >= currentProjectActivePart.targetStitches
      ) {
        if (settings.autoAdvanceRound) {
          handleOverlayIncrementRound();
        }
        return;
      }
      const nextStitch = currentProjectActivePart.currentStitch + 1;
      if (
        settings.autoAdvanceRound &&
        currentProjectActivePart.targetStitches > 0 &&
        nextStitch >= currentProjectActivePart.targetStitches
      ) {
        handleOverlayIncrementRound();
      } else {
        const capped = currentProjectActivePart.targetStitches > 0
          ? Math.min(nextStitch, currentProjectActivePart.targetStitches)
          : nextStitch;
        const updatedParts = currentProject.parts.map((p) =>
          p.id === currentProjectActivePart.id ? { ...p, currentStitch: capped } : p
        );
        handleUpdateProject({ ...currentProject, parts: updatedParts });
      }
    } else {
      if (quickCounter.targetStitches > 0 && quickCounter.currentStitch >= quickCounter.targetStitches) {
        if (settings.autoAdvanceRound) {
          handleOverlayIncrementRound();
        }
        return;
      }
      const nextStitch = quickCounter.currentStitch + 1;
      if (
        settings.autoAdvanceRound &&
        quickCounter.targetStitches > 0 &&
        nextStitch >= quickCounter.targetStitches
      ) {
        handleOverlayIncrementRound();
      } else {
        const capped = quickCounter.targetStitches > 0
          ? Math.min(nextStitch, quickCounter.targetStitches)
          : nextStitch;
        const updatedHistory = {
          ...(quickCounter.roundHistory || {}),
          [quickCounter.currentRound]: capped,
        };
        handleUpdateQuickCounter({
          ...quickCounter,
          currentStitch: capped,
          roundHistory: updatedHistory,
        });
      }
    }
  };

  const handleOverlayDecrementStitch = () => {
    if (currentProject && currentProjectActivePart) {
      if (currentProjectActivePart.currentStitch <= 0) return;
      const updatedParts = currentProject.parts.map((p) =>
        p.id === currentProjectActivePart.id
          ? { ...p, currentStitch: currentProjectActivePart.currentStitch - 1 }
          : p
      );
      handleUpdateProject({ ...currentProject, parts: updatedParts });
    } else {
      if (quickCounter.currentStitch <= 0) return;
      const nextStitch = quickCounter.currentStitch - 1;
      const updatedHistory = {
        ...(quickCounter.roundHistory || {}),
        [quickCounter.currentRound]: nextStitch,
      };
      handleUpdateQuickCounter({
        ...quickCounter,
        currentStitch: nextStitch,
        roundHistory: updatedHistory,
      });
    }
  };

  const handleOverlayResetStitches = () => {
    if (currentProject && currentProjectActivePart) {
      const updatedParts = currentProject.parts.map((p) =>
        p.id === currentProjectActivePart.id ? { ...p, currentStitch: 0 } : p
      );
      handleUpdateProject({ ...currentProject, parts: updatedParts });
    } else {
      const updatedHistory = {
        ...(quickCounter.roundHistory || {}),
        [quickCounter.currentRound]: 0,
      };
      handleUpdateQuickCounter({
        ...quickCounter,
        currentStitch: 0,
        roundHistory: updatedHistory,
      });
    }
  };

  const handleOverlaySetTargetStitches = (num: number) => {
    if (currentProject && currentProjectActivePart) {
      const updatedParts = currentProject.parts.map((p) =>
        p.id === currentProjectActivePart.id ? { ...p, targetStitches: num } : p
      );
      handleUpdateProject({ ...currentProject, parts: updatedParts });
    } else {
      const updatedTargets = {
        ...(quickCounter.roundTargets || {}),
        [quickCounter.currentRound]: num,
      };
      handleUpdateQuickCounter({
        ...quickCounter,
        targetStitches: num,
        roundTargets: updatedTargets,
      });
    }
  };

  const handleOverlaySelectPart = (partId: string) => {
    if (currentProject) {
      handleUpdateProject({ ...currentProject, activePartId: partId });
    }
  };

  // Switch project or switch to free counter
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    StorageService.setActiveProjectId(id);
    setActiveScreen('counter');
  };

  const handleSelectFreeCounter = () => {
    setActiveProjectId('free');
    StorageService.setActiveProjectId('free');
    setActiveScreen('counter');
  };

  // Reload projects from storage
  const handleRefreshProjects = () => {
    const refreshed = StorageService.getAllProjects();
    setProjects(refreshed);
    if (!refreshed.some((p) => p.id === activeProjectId)) {
      setActiveProjectId('free');
    }
  };

  // Save settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
  };

  // Trigger color alert popup
  const handleTriggerColorAlert = (reminder: ColorReminder, partName: string) => {
    setColorAlert({
      isOpen: true,
      reminder,
      partName,
    });
  };

  // Color reminders update handler (works for either project or free counter)
  const handleUpdateColorReminders = (updatedReminders: ColorReminder[]) => {
    if (currentProject && currentProjectActivePart) {
      const updatedParts = currentProject.parts.map((p) =>
        p.id === currentProjectActivePart.id ? { ...p, colorReminders: updatedReminders } : p
      );
      handleUpdateProject({ ...currentProject, parts: updatedParts });
    } else {
      handleUpdateQuickCounter({ ...quickCounter, colorReminders: updatedReminders });
    }
  };

  // Active color reminders for the modal
  const modalColorReminders = currentProjectActivePart
    ? currentProjectActivePart.colorReminders
    : quickCounter.colorReminders;

  const modalCurrentRound = currentProjectActivePart
    ? currentProjectActivePart.currentRound
    : quickCounter.currentRound;

  const modalPartName = currentProjectActivePart
    ? `${currentProject?.title} • ${currentProjectActivePart.name}`
    : 'Contador Livre';

  // Dummy project fallback for PDF viewer when in free counter mode
  const pdfProjectFallback: AmigurumiProject = currentProject || {
    id: 'free_counter_pdf',
    title: 'Receita Amigurumi',
    patternName: '',
    hookSize: '2.5mm',
    yarnBrand: '',
    category: 'Geral',
    notes: '',
    status: 'active',
    activePartId: 'part_free',
    parts: [
      {
        id: 'part_free',
        name: 'Peça Principal',
        targetRounds: quickCounter.targetRounds || 20,
        currentRound: quickCounter.currentRound,
        currentStitch: quickCounter.currentStitch,
        targetStitches: 6,
        isCompleted: false,
        order: 1,
        colorReminders: quickCounter.colorReminders,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Theme wrapper classes with cozy, non-glare warm linen tone
  const getThemeClass = () => {
    if (settings.theme === 'dark-crochet') return 'dark bg-[#1A1816] text-stone-100';
    if (settings.theme === 'pastel-mint') return 'bg-[#E5ECE7] text-stone-800';
    if (settings.theme === 'soft-rose') return 'bg-[#ECE0E3] text-stone-800';
    return 'bg-[#ECE5D8] text-[#2D2824]';
  };

  return (
    <div className={`${isSplitMode ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col transition-colors duration-200 ${getThemeClass()}`}>
      {/* Header: Clean, airy, spacious on both mobile and PC (no crowding!) */}
      <header className="shrink-0 z-30 bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-[#D8CABE] dark:border-stone-800 px-3.5 sm:px-6 py-2 transition-colors shadow-xs h-14">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Brand logo + title */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-2 text-left cursor-pointer group"
              title="Ir para o Menu Principal"
            >
              <div className="w-8 h-8 rounded-xl bg-[#8C5E47] group-hover:bg-[#724A36] flex items-center justify-center text-white text-base shadow-xs shrink-0 transition-colors">
                <span>🧶</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-[#2D2824] dark:text-stone-50 font-comfortaa leading-none shrink-0">
                AmiContador
              </h1>
            </button>

            {/* In counter mode: show project chip + quick switch to free counter */}
            {activeScreen === 'counter' && (
              <div className="flex items-center gap-1.5 min-w-0 ml-1">
                <button
                  onClick={() => setIsProjectsOpen(true)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E2D6C5] dark:bg-stone-800 text-[#5C4B3E] dark:text-stone-300 hover:bg-[#D5C6B1] transition-colors truncate max-w-[85px] sm:max-w-[150px] cursor-pointer"
                  title="Trocar de projeto ou abrir projetos"
                >
                  {currentProject ? currentProject.title : 'Livre'} ▼
                </button>

                {currentProject ? (
                  <button
                    onClick={handleSelectFreeCounter}
                    className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-xs cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                    title="Alternar imediatamente para o Contador Livre (sem projeto)"
                  >
                    <span>⚡</span>
                    <span className="hidden xs:inline">Modo Livre</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsProjectsOpen(true)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8C5E47] hover:bg-[#724A36] text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    title="Abrir um dos seus projetos salvos"
                  >
                    <span>🧶</span>
                    <span className="hidden xs:inline">Projetos</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Theme Toggle + Projetos + Ajustes (Clean, uncluttered!) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                const nextTheme = settings.theme === 'dark-crochet' ? 'warm-yarn' : 'dark-crochet';
                handleUpdateSettings({ ...settings, theme: nextTheme });
                showToast(nextTheme === 'dark-crochet' ? 'Tema escuro ativado 🌙' : 'Tema claro (linho) ativado ☀️');
              }}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#FAF5ED] hover:bg-[#EFE8DC] dark:bg-stone-800 dark:hover:bg-stone-700 border border-[#D6C8B8] dark:border-stone-700 text-[#2D2824] dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title={settings.theme === 'dark-crochet' ? 'Mudar para tema claro (Linho)' : 'Mudar para tema escuro (Noturno)'}
              aria-label={settings.theme === 'dark-crochet' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {settings.theme === 'dark-crochet' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden md:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#8C5E47]" />
                  <span className="hidden md:inline">Escuro</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsProjectsOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#FAF5ED] hover:bg-[#EFE8DC] dark:bg-stone-800 dark:hover:bg-stone-700 border border-[#D6C8B8] dark:border-stone-700 text-[#2D2824] dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Meus Projetos"
            >
              <FolderOpen className="w-4 h-4 text-[#8C5E47] dark:text-amber-400" />
              <span className="hidden sm:inline">Projetos</span>
            </button>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#8C5E47] hover:bg-[#724A36] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-[#8C5E47]/25"
              title="Ajustes e Ferramentas"
            >
              <Menu className="w-4 h-4" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Supports Split View on PC */}
      <main className={`flex-1 w-full mx-auto flex flex-col justify-start ${isSplitMode ? 'h-[calc(100vh-56px)] overflow-hidden' : ''}`}>
        {/* Screen wake lock notice if active (hidden in split mode to preserve exact 100vh lock) */}
        {settings.keepAwake && !isSplitMode && (
          <div className="max-w-xl mx-auto w-full px-3 pt-2">
            <div className="px-3 py-1.5 rounded-2xl bg-[#FFF6EE] dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between shadow-xs">
              <span className="flex items-center gap-1.5 font-medium text-[11px]">
                <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><strong>Modo Crochê Ativo:</strong> Tela permanecerá ligada.</span>
              </span>
              <button
                onClick={() => handleUpdateSettings({ ...settings, keepAwake: false })}
                className="text-[10px] font-bold text-amber-800 dark:text-amber-400 underline cursor-pointer ml-2 shrink-0"
              >
                Desativar
              </button>
            </div>
          </div>
        )}

        {activeScreen === 'home' ? (
          /* Main Menu Hub: Prominent buttons for Stitch Counter and Pricing Calculator */
          <div className="flex-1 w-full flex flex-col justify-start pb-16 sm:pb-8">
            <HomeHubView
              currentProject={currentProject}
              quickCounter={quickCounter}
              onNavigateToCounter={() => setActiveScreen('counter')}
              onOpenCalculator={() => setIsPricingOpen(true)}
              onOpenDictionary={() => setIsDictionaryOpen(true)}
              onOpenYarnStash={() => setIsYarnStashOpen(true)}
              onOpenPdf={() => setIsPdfOpen(true)}
              onOpenProjectsList={() => setIsProjectsOpen(true)}
            />
          </div>
        ) : isSplitMode ? (
          /* Split View: PC = Two equal-sized frames side-by-side with internal scrolling; Mobile = Fullscreen PDF with Floating Pill */
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
            {/* Left: PDF Column - Same height & width as counter on PC, strictly internal scroll */}
            <div className="w-full md:w-1/2 h-full flex flex-col overflow-hidden border-b md:border-b-0 md:border-r border-[#D6C8B8] dark:border-stone-800 relative bg-[#24211E]">
              <PdfViewerModal
                isOpen={false}
                isSplitMode={true}
                onClose={() => setIsSplitMode(false)}
                onToggleSplitMode={() => setIsSplitMode(false)}
                project={pdfProjectFallback}
                onUpdateProject={(up) => {
                  if (currentProject) {
                    handleUpdateProject(up);
                  }
                }}
                onCreateProjectFromPdf={handleCreateProjectFromPdf}
              />

              {/* Floating Counter Overlay on Mobile */}
              <div className="md:hidden">
                <FloatingCounterOverlay
                  title={currentProject ? currentProject.title : 'Contador Livre'}
                  activePart={currentProjectActivePart || undefined}
                  parts={currentProject?.parts}
                  currentRound={currentProjectActivePart ? currentProjectActivePart.currentRound : quickCounter.currentRound}
                  targetRounds={currentProjectActivePart ? currentProjectActivePart.targetRounds : quickCounter.targetRounds}
                  currentStitch={currentProjectActivePart ? currentProjectActivePart.currentStitch : quickCounter.currentStitch}
                  targetStitches={currentProjectActivePart ? currentProjectActivePart.targetStitches : quickCounter.targetStitches}
                  settings={settings}
                  onIncrementRound={handleOverlayIncrementRound}
                  onDecrementRound={handleOverlayDecrementRound}
                  onIncrementStitch={handleOverlayIncrementStitch}
                  onDecrementStitch={handleOverlayDecrementStitch}
                  onResetStitches={handleOverlayResetStitches}
                  onSetTargetStitches={handleOverlaySetTargetStitches}
                  onSelectPart={handleOverlaySelectPart}
                  onClose={() => setIsSplitMode(false)}
                />
              </div>
            </div>

            {/* Right: Counter Column - Same height as PDF, buttons always visible and accessible */}
            <div className="hidden md:flex md:w-1/2 h-full flex-col overflow-y-auto p-3 sm:p-5 bg-amigurumi-canvas dark:bg-stone-950">
              <div className="w-full max-w-xl mx-auto">
                {currentProject ? (
                  <CounterView
                    project={currentProject}
                    settings={settings}
                    onUpdateProject={handleUpdateProject}
                    onOpenColorModal={() => setIsColorsOpen(true)}
                    onOpenPartsModal={() => setIsPartsOpen(true)}
                    onOpenPdfModal={() => setIsPdfOpen(true)}
                    onTriggerColorAlert={handleTriggerColorAlert}
                    onSwitchToFreeCounter={handleSelectFreeCounter}
                  />
                ) : (
                  <FreeCounterView
                    counter={quickCounter}
                    settings={settings}
                    onUpdateCounter={handleUpdateQuickCounter}
                    onResetCounter={handleResetQuickCounter}
                    onSaveAsProject={handleSaveFreeCounterAsProject}
                    onOpenColorModal={() => setIsColorsOpen(true)}
                    onOpenPdfModal={() => setIsPdfOpen(true)}
                    onTriggerColorAlert={handleTriggerColorAlert}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Standard Single Column View - Compact padding on mobile so button is high up */
          <div className="max-w-xl w-full mx-auto px-3 py-2 sm:p-6 pb-20 sm:pb-8">
            {currentProject ? (
              <CounterView
                project={currentProject}
                settings={settings}
                onUpdateProject={handleUpdateProject}
                onOpenColorModal={() => setIsColorsOpen(true)}
                onOpenPartsModal={() => setIsPartsOpen(true)}
                onOpenPdfModal={() => setIsPdfOpen(true)}
                onTriggerColorAlert={handleTriggerColorAlert}
                onSwitchToFreeCounter={handleSelectFreeCounter}
              />
            ) : (
              <FreeCounterView
                counter={quickCounter}
                settings={settings}
                onUpdateCounter={handleUpdateQuickCounter}
                onResetCounter={handleResetQuickCounter}
                onSaveAsProject={handleSaveFreeCounterAsProject}
                onOpenColorModal={() => setIsColorsOpen(true)}
                onOpenPdfModal={() => setIsPdfOpen(true)}
                onTriggerColorAlert={handleTriggerColorAlert}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile / Tablet Bottom Navigation Bar (1-tap access to primary tools) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-[#D8CABE] dark:border-stone-800 py-1.5 px-3 flex items-center justify-around sm:hidden shadow-lg">
        <button
          onClick={() => setActiveScreen('home')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeScreen === 'home'
              ? 'text-[#8C5E47] dark:text-amber-400 font-extrabold'
              : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveScreen('counter')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors cursor-pointer ${
            activeScreen === 'counter'
              ? 'text-[#8C5E47] dark:text-amber-400 font-extrabold'
              : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
          }`}
        >
          <Hash className="w-5 h-5" />
          <span>Contador</span>
        </button>

        <button
          onClick={() => setIsPricingOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold text-stone-500 hover:text-[#C85A32] dark:text-stone-400 cursor-pointer"
        >
          <Calculator className="w-5 h-5 text-[#C85A32]" />
          <span>Calculadora</span>
        </button>

        <button
          onClick={() => setIsDictionaryOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold text-stone-500 hover:text-stone-700 dark:text-stone-400 cursor-pointer"
        >
          <BookOpen className="w-5 h-5" />
          <span>Dicionário</span>
        </button>

        <button
          onClick={() => setIsYarnStashOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold text-stone-500 hover:text-emerald-600 dark:text-stone-400 cursor-pointer"
        >
          <Package className="w-5 h-5" />
          <span>Armarinho</span>
        </button>
      </nav>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#2D2824] text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-stone-700 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Unified Menu Drawer Modal */}
      <MenuDrawerModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenPdf={() => setIsPdfOpen(true)}
        onOpenSupabase={() => setIsSupabaseOpen(true)}
        onOpenCalculator={() => setIsPricingOpen(true)}
        onOpenDictionary={() => setIsDictionaryOpen(true)}
        onOpenYarnStash={() => setIsYarnStashOpen(true)}
        isSplitMode={isSplitMode}
        onToggleSplitMode={() => setIsSplitMode(!isSplitMode)}
      />

      {/* PDF Recipe Modal */}
      <PdfViewerModal
        isOpen={isPdfOpen}
        isSplitMode={false}
        onClose={() => setIsPdfOpen(false)}
        onToggleSplitMode={() => {
          setIsSplitMode(true);
          setIsPdfOpen(false);
          setActiveScreen('counter');
        }}
        project={pdfProjectFallback}
        onUpdateProject={(up) => {
          if (currentProject) {
            handleUpdateProject(up);
          } else {
            handleCreateProjectFromPdf(up);
          }
        }}
        onCreateProjectFromPdf={handleCreateProjectFromPdf}
      />

      {/* Parts Modal (Project mode only) */}
      {currentProject && (
        <PartManagerModal
          isOpen={isPartsOpen}
          onClose={() => setIsPartsOpen(false)}
          project={currentProject}
          onUpdateProject={handleUpdateProject}
        />
      )}

      {/* Color Reminders Modal */}
      <ColorRemindersModal
        isOpen={isColorsOpen}
        onClose={() => setIsColorsOpen(false)}
        partName={modalPartName}
        currentRound={modalCurrentRound}
        colorReminders={modalColorReminders}
        onUpdateReminders={handleUpdateColorReminders}
      />

      {/* Sync / QR Modal */}
      <SyncShareModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        project={pdfProjectFallback}
        onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
      />

      {/* Supabase Optional Modal */}
      <SupabaseModal
        isOpen={isSupabaseOpen}
        onClose={() => setIsSupabaseOpen(false)}
        currentProject={pdfProjectFallback}
        onRefreshProjects={handleRefreshProjects}
      />

      {/* Project List Modal */}
      <ProjectListModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onSelectFreeCounter={handleSelectFreeCounter}
        onRefreshProjects={handleRefreshProjects}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Color Alert Popup */}
      {colorAlert.reminder && (
        <ColorAlertModal
          isOpen={colorAlert.isOpen}
          onClose={() => setColorAlert({ ...colorAlert, isOpen: false })}
          reminder={colorAlert.reminder}
          partName={colorAlert.partName}
        />
      )}

      {/* Pricing Calculator Modal */}
      <PricingCalculatorModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        defaultTimeSeconds={currentProject?.totalTimeSeconds || quickCounter.totalTimeSeconds || 0}
        defaultPieceName={currentProject ? currentProject.title : 'Meu Amigurumi'}
        onShowToast={showToast}
      />

      {/* Crochet Terms Dictionary & Translator Modal */}
      <CrochetDictionaryModal
        isOpen={isDictionaryOpen}
        onClose={() => setIsDictionaryOpen(false)}
        onShowToast={showToast}
      />

      {/* Yarn Stash Inventory Modal */}
      <YarnStashModal
        isOpen={isYarnStashOpen}
        onClose={() => setIsYarnStashOpen(false)}
        onShowToast={showToast}
      />
    </div>
  );
}
