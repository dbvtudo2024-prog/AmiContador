import React, { useState } from 'react';
import { AmigurumiProject, ProjectPart } from '../types/amigurumi';
import { X, Plus, Trash2, CheckCircle2, Circle, Layers, Sparkles } from 'lucide-react';

interface PartManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: AmigurumiProject;
  onUpdateProject: (updatedProject: AmigurumiProject) => void;
}

const COMMON_PART_NAMES = [
  'Cabeça',
  'Corpo',
  'Braço Direito',
  'Braço Esquerdo',
  'Braços (2x)',
  'Perna Direita',
  'Perna Esquerda',
  'Pernas (2x)',
  'Orelha Direita',
  'Orelha Esquerda',
  'Orelhas (2x)',
  'Focinho',
  'Rabinho',
  'Asas (2x)',
  'Chifre / Tromba',
  'Cabelo / Peruca',
  'Chapéu / Gorro',
  'Laço / Gravata',
  'Roupinha / Vestido',
];

export const PartManagerModal: React.FC<PartManagerModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  const [newPartName, setNewPartName] = useState('');
  const [targetRounds, setTargetRounds] = useState(20);
  const [targetStitches, setTargetStitches] = useState(6);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartName.trim()) return;

    const newPart: ProjectPart = {
      id: 'part_' + Math.random().toString(36).substring(2, 8),
      name: newPartName.trim(),
      targetRounds: Number(targetRounds) || 20,
      currentRound: 1,
      currentStitch: 0,
      targetStitches: Number(targetStitches) || 6,
      isCompleted: false,
      notes: notes.trim() || undefined,
      colorReminders: [],
      order: project.parts.length + 1,
    };

    const updatedParts = [...project.parts, newPart];
    onUpdateProject({
      ...project,
      parts: updatedParts,
      activePartId: project.activePartId || newPart.id,
    });

    setNewPartName('');
    setNotes('');
  };

  const handleDeletePart = (partId: string) => {
    if (project.parts.length <= 1) {
      alert('O projeto precisa ter pelo menos 1 peça.');
      return;
    }
    const updatedParts = project.parts.filter((p) => p.id !== partId);
    let nextActive = project.activePartId;
    if (project.activePartId === partId) {
      nextActive = updatedParts[0]?.id || '';
    }
    onUpdateProject({
      ...project,
      parts: updatedParts,
      activePartId: nextActive,
    });
  };

  const handleTogglePartCompleted = (partId: string) => {
    const updatedParts = project.parts.map((p) =>
      p.id === partId ? { ...p, isCompleted: !p.isCompleted } : p
    );
    onUpdateProject({
      ...project,
      parts: updatedParts,
    });
  };

  const handleSelectActivePart = (partId: string) => {
    onUpdateProject({
      ...project,
      activePartId: partId,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
                Partes do Amigurumi
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {project.title} • {project.parts.filter((p) => p.isCompleted).length} de {project.parts.length} peças concluídas
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
          {/* Quick Add Part Form */}
          <form onSubmit={handleAddPart} className="p-4 rounded-2xl bg-amber-50/60 dark:bg-stone-800/50 border border-amber-200/80 dark:border-stone-700/80 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <Plus className="w-4 h-4" /> Adicionar Nova Peça
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                Nome da Peça:
              </label>
              <input
                type="text"
                placeholder="Ex: Cabeça, Orelha Direita, Focinho..."
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                required
              />

              {/* Suggestions chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_PART_NAMES.slice(0, 7).map((sugg) => (
                  <button
                    key={sugg}
                    type="button"
                    onClick={() => setNewPartName(sugg)}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-700 dark:bg-stone-800 dark:hover:bg-amber-950/60 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                  >
                    + {sugg}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Total de Voltas (Meta):
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={targetRounds}
                  onChange={(e) => setTargetRounds(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
                  Pontos p/ Volta inicial:
                </label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={targetStitches}
                  onChange={(e) => setTargetStitches(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Adicionar Peça
            </button>
          </form>

          {/* List of parts */}
          <div className="space-y-2.5">
            <h4 className="text-sm font-bold text-stone-700 dark:text-stone-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Peças do Projeto ({project.parts.length})
            </h4>

            {project.parts.map((p) => {
              const isActive = project.activePartId === p.id;
              const percent = Math.min(100, Math.round((p.currentRound / Math.max(1, p.targetRounds)) * 100));

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30'
                      : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleTogglePartCompleted(p.id)}
                        className="text-stone-400 hover:text-emerald-500 transition-colors shrink-0"
                        title={p.isCompleted ? 'Marcar como em andamento' : 'Marcar como concluída'}
                      >
                        {p.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-base truncate ${
                              p.isCompleted
                                ? 'line-through text-stone-400 dark:text-stone-500'
                                : 'text-stone-900 dark:text-stone-100'
                            }`}
                          >
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
                              Ativa no contador
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1">
                          <span>
                            Volta <strong>{p.currentRound}</strong> de {p.targetRounds} ({percent}%)
                          </span>
                          {p.colorReminders.length > 0 && (
                            <span className="text-pink-600 dark:text-pink-400 font-medium">
                              🎨 {p.colorReminders.length} troca{p.colorReminders.length > 1 ? 's' : ''} de cor
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && (
                        <button
                          onClick={() => handleSelectActivePart(p.id)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-800 dark:text-stone-200 font-bold text-xs cursor-pointer transition-colors"
                        >
                          Contar nesta
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePart(p.id)}
                        className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        title="Excluir peça"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden mt-3">
                    <div
                      className={`h-full transition-all duration-300 ${
                        p.isCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50/50 dark:bg-stone-800/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm cursor-pointer"
          >
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
};
