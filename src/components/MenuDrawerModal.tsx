import React from 'react';
import { AppSettings } from '../types/amigurumi';
import {
  X,
  Share2,
  Database,
  FileText,
  Volume2,
  Smartphone,
  Eye,
  Keyboard,
  Split,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';

interface MenuDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onOpenSync: () => void;
  onOpenPdf: () => void;
  onOpenSupabase: () => void;
  isSplitMode: boolean;
  onToggleSplitMode: () => void;
}

export const MenuDrawerModal: React.FC<MenuDrawerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onOpenSync,
  onOpenPdf,
  onOpenSupabase,
  isSplitMode,
  onToggleSplitMode,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#FAF5ED] dark:bg-stone-900 border border-[#D6C8B8] dark:border-stone-800 rounded-3xl max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header with single, clear close X button */}
        <div className="p-3.5 sm:p-4 border-b border-[#D6C8B8] dark:border-stone-800 flex items-center justify-between bg-[#F0E8DC]/80 dark:bg-stone-800/40">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🧶</span>
            <div>
              <h3 className="text-base font-bold text-[#2D2824] dark:text-stone-100 font-comfortaa">
                Ajustes & Ferramentas
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                AmiContador • Crochê & Amigurumi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-[#E5DCD0] dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-sm">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                onClose();
                onOpenPdf();
              }}
              className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-[#EADFCF] dark:border-stone-700 hover:border-[#E07A5F] flex flex-col items-center text-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#D0694E] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-xs text-[#2D2A26] dark:text-stone-200">
                  Receita em PDF
                </span>
                <span className="text-[10px] text-stone-400">Ver e seguir receita</span>
              </div>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSync();
              }}
              className="p-3 rounded-2xl bg-white dark:bg-stone-800 border border-[#EADFCF] dark:border-stone-700 hover:border-purple-300 flex flex-col items-center text-center gap-2 cursor-pointer transition-all shadow-xs"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold text-xs text-[#2D2A26] dark:text-stone-200">
                  Sincronizar PC / Celular
                </span>
                <span className="text-[10px] text-stone-400">QR Code instantâneo</span>
              </div>
            </button>
          </div>

          {/* Theme Palette / Modo Noturno Switcher */}
          <div className="p-3.5 rounded-2xl bg-[#F8F4EC]/70 dark:bg-stone-800/60 border border-[#EADFCF] dark:border-stone-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D2A26] dark:text-stone-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E07A5F]" />
                Tema Visual do App
              </span>
              <span className="text-[10px] font-semibold text-stone-400">
                {settings.theme === 'dark-crochet' ? '🌙 Modo Escuro Ativo' : '☀️ Modo Claro Ativo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'warm-yarn' })}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'warm-yarn'
                    ? 'border-[#8C5E47] bg-[#FAF5ED] font-bold text-[#8C5E47] shadow-xs'
                    : 'border-[#EADFCF] dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">Linho (Claro)</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark-crochet' })}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'dark-crochet'
                    ? 'border-amber-400 bg-stone-900 font-bold text-amber-300 shadow-xs'
                    : 'border-[#EADFCF] dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Noturno (Escuro)</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'pastel-mint' })}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'pastel-mint'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-800 dark:text-emerald-200 shadow-xs'
                    : 'border-[#EADFCF] dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Menta Pastel</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'soft-rose' })}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  settings.theme === 'soft-rose'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/60 font-bold text-pink-800 dark:text-pink-200 shadow-xs'
                    : 'border-[#EADFCF] dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-pink-400 shrink-0" />
                <span className="truncate">Rosa Quartzo</span>
              </button>
            </div>
          </div>

          {/* Screen Wake Lock */}
          <div className="p-3.5 rounded-2xl bg-[#F8F4EC]/70 dark:bg-stone-800/60 border border-[#EADFCF] dark:border-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#2D2A26] dark:text-stone-200">
                  Manter tela sempre acesa
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  A tela do celular não apaga ao crochetar
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.keepAwake}
                onChange={(e) => onUpdateSettings({ ...settings, keepAwake: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#E07A5F]"></div>
            </label>
          </div>

          {/* Sound & Volume */}
          <div className="p-3.5 rounded-2xl bg-[#F8F4EC]/70 dark:bg-stone-800/60 border border-[#EADFCF] dark:border-stone-700 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 flex items-center justify-center shrink-0">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-[#2D2A26] dark:text-stone-200">
                    Sons do Contador
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                    Clique suave e sino de nova volta
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#E07A5F]"></div>
              </label>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2 border-t border-[#EADFCF]/60 dark:border-stone-700 flex items-center gap-2 text-xs">
                <span className="text-stone-500">Volume:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => onUpdateSettings({ ...settings, soundVolume: parseFloat(e.target.value) })}
                  className="flex-1 accent-[#E07A5F] cursor-pointer"
                />
                <span className="text-[11px] font-mono text-stone-600 dark:text-stone-400 w-8 text-right">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Vibration */}
          <div className="p-3.5 rounded-2xl bg-[#F8F4EC]/70 dark:bg-stone-800/60 border border-[#EADFCF] dark:border-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold text-[#2D2A26] dark:text-stone-200">
                  Vibração no Celular
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">
                  Retorno tátil suave a cada volta
                </span>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-stone-300 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-[#E07A5F]"></div>
            </label>
          </div>

          {/* PC Split Mode & Cloud Database */}
          <div className="pt-2 border-t border-[#EADFCF] dark:border-stone-800 space-y-2">
            <button
              onClick={() => {
                onClose();
                onToggleSplitMode();
              }}
              className="w-full p-2.5 rounded-xl border border-[#EADFCF] dark:border-stone-700 hover:bg-[#F8F4EC] dark:hover:bg-stone-800 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Split className="w-4 h-4 text-stone-500" />
                Modo Tela Dividida (PDF ao lado do contador)
              </span>
              <span className="text-[11px] text-[#E07A5F]">
                {isSplitMode ? 'Ativo' : 'Ativar'}
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSupabase();
              }}
              className="w-full p-2.5 rounded-xl border border-[#EADFCF] dark:border-stone-700 hover:bg-[#F8F4EC] dark:hover:bg-stone-800 flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                Conectar Banco de Dados Supabase (Opcional)
              </span>
              <span className="text-[11px] text-stone-400">➔</span>
            </button>
          </div>

          {/* PC Shortcuts Reminder */}
          <div className="p-3 bg-amber-50/50 dark:bg-stone-800/40 rounded-xl border border-amber-200/60 dark:border-stone-700 text-xs space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1 text-[11px]">
              <Keyboard className="w-3.5 h-3.5" /> Atalhos no PC:
            </span>
            <p className="text-stone-600 dark:text-stone-400 text-[11px]">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-stone-700 rounded border border-stone-200 text-[10px] font-mono">Espaço</kbd> ou <kbd className="px-1.5 py-0.5 bg-white dark:bg-stone-700 rounded border border-stone-200 text-[10px] font-mono">↑</kbd> = +1 Volta &bull; <kbd className="px-1.5 py-0.5 bg-white dark:bg-stone-700 rounded border border-stone-200 text-[10px] font-mono">→</kbd> = +1 Ponto
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
