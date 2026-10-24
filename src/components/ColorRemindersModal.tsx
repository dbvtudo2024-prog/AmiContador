import React, { useState } from 'react';
import { ColorReminder, ProjectPart } from '../types/amigurumi';
import { X, Plus, Trash2, Palette, Sparkles } from 'lucide-react';

interface ColorRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: ProjectPart;
  onUpdatePart: (updatedPart: ProjectPart) => void;
}

// Popular amigurumi yarn shades for quick picking
const POPULAR_YARN_COLORS = [
  { name: 'Branco / Off-White', hex: '#FAF9F6' },
  { name: 'Chantilly / Porcelana', hex: '#EED9C4' },
  { name: 'Caramelo / Castanha', hex: '#C68642' },
  { name: 'Brigadeiro / Marrom', hex: '#5D3A1A' },
  { name: 'Preto / Ônix', hex: '#212121' },
  { name: 'Rosa Quartzo / Bebê', hex: '#F9A8D4' },
  { name: 'Pink Intenso', hex: '#EC4899' },
  { name: 'Vermelho Paixão', hex: '#EF4444' },
  { name: 'Laranja Solar', hex: '#F97316' },
  { name: 'Mostarda Vintage', hex: '#EAB308' },
  { name: 'Amarelo Canário', hex: '#FDE047' },
  { name: 'Verde Menta / Pistache', hex: '#86EFAC' },
  { name: 'Verde Militar', hex: '#4D7C0F' },
  { name: 'Azul Bebê Sereno', hex: '#93C5FD' },
  { name: 'Azul Tiffany', hex: '#2DD4BF' },
  { name: 'Azul Marinho / Jeans', hex: '#1E3A8A' },
  { name: 'Lilás Lavanda', hex: '#C084FC' },
  { name: 'Roxo Açaí', hex: '#7E22CE' },
  { name: 'Cinza Mescla', hex: '#9CA3AF' },
];

export const ColorRemindersModal: React.FC<ColorRemindersModalProps> = ({
  isOpen,
  onClose,
  part,
  onUpdatePart,
}) => {
  const [round, setRound] = useState<number>(part.currentRound || 1);
  const [colorName, setColorName] = useState<string>('Mostarda');
  const [colorHex, setColorHex] = useState<string>('#EAB308');
  const [note, setNote] = useState<string>('');

  if (!isOpen) return null;

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorName.trim() || round <= 0) return;

    const newReminder: ColorReminder = {
      id: 'cr_' + Math.random().toString(36).substring(2, 8),
      round: Number(round),
      colorName: colorName.trim(),
      colorHex,
      note: note.trim() || undefined,
    };

    const updatedReminders = [...part.colorReminders, newReminder].sort((a, b) => a.round - b.round);
    onUpdatePart({
      ...part,
      colorReminders: updatedReminders,
    });

    setNote('');
  };

  const handleDeleteReminder = (id: string) => {
    const updated = part.colorReminders.filter((r) => r.id !== id);
    onUpdatePart({
      ...part,
      colorReminders: updated,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
                Lembretes de Troca de Cor
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Peça: <span className="font-semibold text-stone-700 dark:text-stone-200">{part.name}</span>
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
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* New reminder form */}
          <form onSubmit={handleAddReminder} className="p-4 rounded-2xl bg-amber-50/70 dark:bg-stone-800/50 border border-amber-200/80 dark:border-stone-700/80 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <Plus className="w-4 h-4" /> Adicionar Novo Lembrete de Cor
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Na Volta (nº):
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={round}
                  onChange={(e) => setRound(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Nome da Cor:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mostarda 7030"
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Color Swatch Picker */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-2 flex items-center justify-between">
                <span>Tom do fio:</span>
                <span className="flex items-center gap-2 text-[11px] text-stone-400">
                  <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-sm" style={{ backgroundColor: colorHex }} />
                  {colorHex}
                </span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1.5 bg-white dark:bg-stone-900/80 rounded-xl border border-stone-200 dark:border-stone-700">
                {POPULAR_YARN_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => {
                      setColorHex(c.hex);
                      if (!colorName || POPULAR_YARN_COLORS.some((p) => p.name === colorName)) {
                        setColorName(c.name);
                      }
                    }}
                    className={`w-7 h-7 rounded-lg border transition-all ${
                      colorHex === c.hex
                        ? 'ring-2 ring-amber-500 scale-110 shadow-md border-amber-500'
                        : 'border-stone-200 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {/* Custom Color Input */}
                <label className="w-7 h-7 rounded-lg border border-dashed border-stone-400 dark:border-stone-600 flex items-center justify-center cursor-pointer hover:bg-stone-100 dark:hover:bg-stone-800 text-[10px] text-stone-500 relative">
                  +
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Instrução ou Dica (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Fazer troca na última laçada do ponto 30"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Salvar Lembrete de Cor
            </button>
          </form>

          {/* List of current color reminders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Cronograma de Cores ({part.colorReminders.length})
              </h4>
              <span className="text-xs text-stone-400">Ordenado por volta</span>
            </div>

            {part.colorReminders.length === 0 ? (
              <div className="text-center p-6 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 text-stone-400 text-xs">
                Nenhum lembrete de troca de cor cadastrado nesta peça.
                <br />Adicione acima para ser avisado com som e alerta visual na volta certa!
              </div>
            ) : (
              <div className="space-y-2.5">
                {part.colorReminders.map((rem) => {
                  const isCurrent = part.currentRound === rem.round;
                  const isPassed = part.currentRound > rem.round;

                  return (
                    <div
                      key={rem.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/40'
                          : isPassed
                          ? 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 opacity-60'
                          : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl shadow-sm border border-stone-300 dark:border-stone-600 shrink-0 flex items-center justify-center text-xs font-bold"
                          style={{ backgroundColor: rem.colorHex }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 font-mono-numbers">
                              Volta {rem.round}
                            </span>
                            <span className="font-bold text-sm text-stone-800 dark:text-stone-100 truncate">
                              {rem.colorName}
                            </span>
                          </div>
                          {rem.note && (
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                              {rem.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isCurrent && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/60 px-2 py-1 rounded-lg">
                            Agora!
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteReminder(rem.id)}
                          className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                          title="Remover lembrete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50/50 dark:bg-stone-800/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
