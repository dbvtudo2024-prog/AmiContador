/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AmigurumiProject, AppSettings, ColorReminder } from './types/amigurumi';
import { StorageService, DEFAULT_SETTINGS } from './services/storage';
import { CounterView } from './components/CounterView';
import { ProjectListModal } from './components/ProjectListModal';
import { PartManagerModal } from './components/PartManagerModal';
import { ColorRemindersModal } from './components/ColorRemindersModal';
import { ColorAlertModal } from './components/ColorAlertModal';
import { SyncShareModal } from './components/SyncShareModal';
import { SupabaseModal } from './components/SupabaseModal';
import { SettingsModal } from './components/SettingsModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import {
  FolderOpen,
  Share2,
  Settings,
  Database,
  Eye,
  Check,
  FileText,
  Split,
} from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<AmigurumiProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Modals
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
    setProjects(loadedProjects);
    setSettings(loadedSettings);

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
        // Clean hash without reload
        history.replaceState(null, '', window.location.pathname);
        return;
      }
    }

    const savedActiveId = StorageService.getActiveProjectId();
    if (savedActiveId && loadedProjects.some((p) => p.id === savedActiveId)) {
      setActiveProjectId(savedActiveId);
    } else if (loadedProjects.length > 0) {
      setActiveProjectId(loadedProjects[0].id);
      StorageService.setActiveProjectId(loadedProjects[0].id);
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

  // Current active project
  const currentProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  // Save changes to current project
  const handleUpdateProject = (updated: AmigurumiProject) => {
    const saved = StorageService.saveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
  };

  // Switch project
  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    StorageService.setActiveProjectId(id);
  };

  // Reload projects from storage
  const handleRefreshProjects = () => {
    const refreshed = StorageService.getAllProjects();
    setProjects(refreshed);
    if (!refreshed.some((p) => p.id === activeProjectId) && refreshed.length > 0) {
      setActiveProjectId(refreshed[0].id);
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

  // Theme wrapper classes
  const getThemeClass = () => {
    if (settings.theme === 'dark-crochet') return 'dark bg-stone-950 text-stone-100';
    if (settings.theme === 'pastel-mint') return 'bg-emerald-50/40 text-stone-800';
    if (settings.theme === 'soft-rose') return 'bg-pink-50/40 text-stone-800';
    return 'bg-yarn-pattern text-stone-800';
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${getThemeClass()}`}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-stone-900/85 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-3 sm:px-4 py-2.5 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <span className="text-lg">🧶</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-extrabold tracking-tight text-stone-900 dark:text-stone-50 font-comfortaa leading-none">
                AmiContador
              </h1>
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
                Crochê & Amigurumi
              </span>
            </div>
          </div>

          {/* Project Switcher Pill */}
          <button
            onClick={() => setIsProjectsOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all cursor-pointer max-w-[140px] sm:max-w-xs truncate shadow-xs"
            title="Abrir banco de projetos"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{currentProject ? currentProject.title : 'Selecionar Projeto'}</span>
            <span className="text-[10px] text-stone-400 shrink-0">▼</span>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* PDF Recipe Button */}
            <button
              onClick={() => setIsPdfOpen(true)}
              className="px-2.5 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Abrir ou anexar receita em PDF"
            >
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Receita PDF</span>
            </button>

            {/* Split screen toggle on PC when PDF modal isn't full screen */}
            {currentProject && (
              <button
                onClick={() => setIsSplitMode(!isSplitMode)}
                className={`hidden md:flex p-2 rounded-2xl border transition-colors ${
                  isSplitMode
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-700'
                }`}
                title={isSplitMode ? 'Desativar tela dividida' : 'Modo Dividido: PDF à esquerda e Contador à direita'}
              >
                <Split className="w-4 h-4" />
              </button>
            )}

            {/* Sync QR / Share button */}
            <button
              onClick={() => setIsSyncOpen(true)}
              className="p-2 sm:px-2.5 sm:py-1.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Sincronizar entre PC e celular via QR Code"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden lg:inline">Sincronizar</span>
            </button>

            {/* Supabase button */}
            <button
              onClick={() => setIsSupabaseOpen(true)}
              className="p-2 rounded-2xl text-stone-600 hover:text-emerald-600 dark:text-stone-400 dark:hover:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
              title="Banco de Dados Supabase (Opcional)"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-2xl text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors"
              title="Preferências e Ajustes"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container - Supports Split View on PC */}
      <main className="flex-1 w-full mx-auto flex flex-col justify-start">
        {/* Quick status bar */}
        {settings.keepAwake && (
          <div className="max-w-4xl mx-auto w-full px-4 pt-3">
            <div className="px-3 py-1.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between animate-fade-in">
              <span className="flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5" /> Modo Crochê Ativo: a tela do seu celular não irá apagar.
              </span>
              <button
                onClick={() => handleUpdateSettings({ ...settings, keepAwake: false })}
                className="text-[10px] font-bold underline cursor-pointer"
              >
                Desativar
              </button>
            </div>
          </div>
        )}

        {isSplitMode && currentProject ? (
          /* Split Screen: PDF on left, Counter on right */
          <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-65px)] overflow-hidden">
            <div className="w-full md:w-1/2 h-1/2 md:h-full">
              <PdfViewerModal
                isOpen={false}
                isSplitMode={true}
                onClose={() => setIsSplitMode(false)}
                onToggleSplitMode={() => setIsSplitMode(false)}
                project={currentProject}
                onUpdateProject={handleUpdateProject}
              />
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto p-4 sm:p-6 bg-yarn-pattern dark:bg-stone-950">
              <CounterView
                project={currentProject}
                settings={settings}
                onUpdateProject={handleUpdateProject}
                onOpenColorModal={() => setIsColorsOpen(true)}
                onOpenPartsModal={() => setIsPartsOpen(true)}
                onOpenPdfModal={() => setIsPdfOpen(true)}
                onTriggerColorAlert={handleTriggerColorAlert}
              />
            </div>
          </div>
        ) : (
          /* Standard Single Column View */
          <div className="max-w-4xl w-full mx-auto p-4 sm:p-6">
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
              <div className="text-center py-20">
                <p className="text-stone-500 font-semibold mb-4">Nenhum projeto encontrado.</p>
                <button
                  onClick={() => setIsProjectsOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm"
                >
                  Criar ou Importar Amigurumi
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-stone-700 animate-slide-up">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      {currentProject && (
        <>
          <PdfViewerModal
            isOpen={isPdfOpen}
            isSplitMode={false}
            onClose={() => setIsPdfOpen(false)}
            onToggleSplitMode={() => {
              setIsSplitMode(true);
              setIsPdfOpen(false);
            }}
            project={currentProject}
            onUpdateProject={handleUpdateProject}
          />

          <PartManagerModal
            isOpen={isPartsOpen}
            onClose={() => setIsPartsOpen(false)}
            project={currentProject}
            onUpdateProject={handleUpdateProject}
          />

          <ColorRemindersModal
            isOpen={isColorsOpen}
            onClose={() => setIsColorsOpen(false)}
            part={
              currentProject.parts.find((p) => p.id === currentProject.activePartId) ||
              currentProject.parts[0]
            }
            onUpdatePart={(updatedPart) => {
              const updatedParts = currentProject.parts.map((p) =>
                p.id === updatedPart.id ? updatedPart : p
              );
              handleUpdateProject({ ...currentProject, parts: updatedParts });
            }}
          />

          <SyncShareModal
            isOpen={isSyncOpen}
            onClose={() => setIsSyncOpen(false)}
            project={currentProject}
            onOpenSupabaseModal={() => setIsSupabaseOpen(true)}
          />

          <SupabaseModal
            isOpen={isSupabaseOpen}
            onClose={() => setIsSupabaseOpen(false)}
            currentProject={currentProject}
            onRefreshProjects={handleRefreshProjects}
          />
        </>
      )}

      <ProjectListModal
        isOpen={isProjectsOpen}
        onClose={() => setIsProjectsOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onRefreshProjects={handleRefreshProjects}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

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
