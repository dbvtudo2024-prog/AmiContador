import React from 'react';
import { ColorReminder } from '../types/amigurumi';
import { Sparkles, Check, BellRing } from 'lucide-react';

interface ColorAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: ColorReminder;
  partName: string;
}

export const ColorAlertModal: React.FC<ColorAlertModalProps> = ({
  isOpen,
  onClose,
  reminder,
  partName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border-2 border-amber-300 dark:border-amber-600 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-scale-up">
        {/* Soft decorative background glow */}
        <div
          className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: reminder.colorHex || '#F59E0B' }}
        />

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <BellRing className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Lembrete de Mudança de Cor
            </span>
            <h3 className="text-xl font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
              Volta {reminder.round} • {partName}
            </h3>
          </div>
        </div>

        <div className="my-5 p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl shadow-inner border-2 border-white dark:border-stone-700 shrink-0 ring-4 ring-amber-200 dark:ring-amber-900/50"
            style={{ backgroundColor: reminder.colorHex }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Trocar para o fio:</p>
            <h4 className="text-lg font-bold text-stone-900 dark:text-stone-50 truncate">
              {reminder.colorName}
            </h4>
            {reminder.note && (
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 font-medium bg-amber-50 dark:bg-amber-950/50 p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60">
                💡 {reminder.note}
              </p>
            )}
          </div>
        </div>

        <div className="p-3 bg-amber-50 dark:bg-stone-800/80 rounded-xl text-xs text-stone-600 dark:text-stone-300 border border-amber-100 dark:border-stone-700/60 mb-6 leading-relaxed">
          <strong>Dica Amigurumi:</strong> Faça a troca de cor na <em>última laçada</em> do ponto anterior à volta {reminder.round}. Assim a transição entre cores fica reta e sem degraus visíveis!
        </div>

        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          Entendido, cor trocada!
        </button>
      </div>
    </div>
  );
};
