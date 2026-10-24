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
import {
  FolderOpen,
  Menu,
  Eye,
  Check,
  Sun,
  Moon,
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<AmigurumiProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('free');
  const [quickCounter, setQuickCounter] = useState<QuickCounter>(StorageService.getQuickCounter());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

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

  // Switch project or switch to free counter
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    StorageService.setActiveProjectId(id);
  };

  const handleSelectFreeCounter = () => {
    setActiveProjectId('free');
    StorageService.setActiveProjectId('free');
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
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${getThemeClass()}`}>
      {/* Header: Clean, airy, spacious on both mobile and PC (no crowding!) */}
      <header className="sticky top-0 z-30 bg-[#FAF5ED]/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-[#D8CABE] dark:border-stone-800 px-3.5 sm:px-6 py-2 transition-colors shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Compact brand logo + title + project chip */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#8C5E47] flex items-center justify-center text-white text-base shadow-xs shrink-0">
              <span>🧶</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[#2D2824] dark:text-stone-50 font-comfortaa leading-none shrink-0">
                AmiContador
              </h1>
              <button
                onClick={() => setIsProjectsOpen(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E2D6C5] dark:bg-stone-800 text-[#5C4B3E] dark:text-stone-300 hover:bg-[#D5C6B1] transition-colors truncate max-w-[110px] sm:max-w-[180px] cursor-pointer"
                title="Trocar projeto ou modo livre"
              >
                {currentProject ? currentProject.title : 'Livre'} ▼
              </button>
            </div>
          </div>

          {/* Right: Quick Dark/Light Theme Toggle + Projetos + Ajustes */}
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
      <main className="flex-1 w-full mx-auto flex flex-col justify-start">
        {/* Screen wake lock notice if active */}
        {settings.keepAwake && (
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

        {isSplitMode ? (
          /* Split Screen: PDF on left, Counter on right */
          <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-56px)] overflow-hidden">
            <div className="w-full md:w-1/2 h-1/2 md:h-full">
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
              />
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-3 sm:p-6 bg-amigurumi-canvas dark:bg-stone-950">
              {currentProject ? (
                <CounterView
                  project={currentProject}
                  settings={settings}
                  onUpdateProject={handleUpdateProject}
                  onOpenColorModal={() => setIsColorsOpen(true)}
                  onOpenPartsModal={() => setIsPartsOpen(true)}
                  onOpenPdfModal={() => setIsPdfOpen(true)}
                  onTriggerColorAlert={handleTriggerColorAlert}
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
        ) : (
          /* Standard Single Column View - Compact padding on mobile so button is high up */
          <div className="max-w-xl w-full mx-auto px-3 py-2 sm:p-6">
            {currentProject ? (
              <CounterView
                project={currentProject}
                settings={settings}
                onUpdateProject={handleUpdateProject}
                onOpenColorModal={() => setIsColorsOpen(true)}
                onOpenPartsModal={() => setIsPartsOpen(true)}
                onOpenPdfModal={() => setIsPdfOpen(true)}
                onTriggerColorAlert={handleTriggerColorAlert}
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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#2D2824] text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-stone-700 animate-slide-up">
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
        }}
        project={pdfProjectFallback}
        onUpdateProject={(up) => {
          if (currentProject) {
            handleUpdateProject(up);
          }
        }}
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
    </div>
  );
}
