import React, { useEffect } from 'react';
import { AppSettings } from '../types/amigurumi';
import { X, Volume2, Smartphone, Eye, Sparkles, Moon, Sun, Keyboard, ShieldAlert } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const toggleWakeLock = async (enabled: boolean) => {
    onUpdateSettings({ ...settings, keepAwake: enabled });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
                Preferências & Ajustes
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ajuste som, tela do celular e atalhos de teclado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Keep Screen Awake on mobile */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Manter tela sempre acesa (Wake Lock)
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Impede que a tela do celular apague enquanto você crocheta com as duas mãos ocupadas!
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.keepAwake}
                onChange={(e) => toggleWakeLock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Sound toggle */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Sons do Contador & Alerta de Cor
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Som de clique para pontos, sino para nova volta e aviso musical de troca de cor
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {settings.soundEnabled && (
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center gap-3">
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">Volume:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => onUpdateSettings({ ...settings, soundVolume: parseFloat(e.target.value) })}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 w-8 text-right">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Vibration on mobile */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Vibração Háptica no Celular
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Vibrar suavemente ao somar ponto ou volta (dispositivos compatíveis)
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(e) => onUpdateSettings({ ...settings, vibrationEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Theme Palette */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Tema Visual
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'warm-yarn' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  settings.theme === 'warm-yarn'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 font-bold text-amber-900 dark:text-amber-100 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-amber-500 shrink-0" />
                Fio Quente / Artesanal
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'pastel-mint' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  settings.theme === 'pastel-mint'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-100 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0" />
                Menta Pastel
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'soft-rose' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  settings.theme === 'soft-rose'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/60 font-bold text-pink-900 dark:text-pink-100 shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-pink-500 shrink-0" />
                Rosa Quartzo
              </button>

              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark-crochet' })}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  settings.theme === 'dark-crochet'
                    ? 'border-stone-400 bg-stone-900 font-bold text-white shadow-xs'
                    : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-stone-900 border border-stone-600 shrink-0" />
                Crochê Noturno (Escuro)
              </button>
            </div>
          </div>

          {/* PC Keyboard Shortcuts */}
          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-stone-800/40 border border-amber-200/80 dark:border-stone-700 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4" /> Atalhos de Teclado no PC
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 dark:text-stone-300">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span>+1 Volta</span>
                <kbd className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded font-mono font-bold text-[10px]">
                  Espaço ou ↑
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span>-1 Volta</span>
                <kbd className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded font-mono font-bold text-[10px]">
                  ↓
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span>+1 Ponto</span>
                <kbd className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded font-mono font-bold text-[10px]">
                  → ou P
                </kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <span>-1 Ponto</span>
                <kbd className="px-2 py-0.5 bg-stone-100 dark:bg-stone-700 rounded font-mono font-bold text-[10px]">
                  ←
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50/50 dark:bg-stone-800/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm cursor-pointer"
          >
            Salvar & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
