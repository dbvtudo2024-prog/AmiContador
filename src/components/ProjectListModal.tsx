import React, { useState } from 'react';
import { AmigurumiProject } from '../types/amigurumi';
import { StorageService } from '../services/storage';
import {
  X,
  Plus,
  Copy,
  Trash2,
  FolderOpen,
  Download,
  Upload,
  Search,
  Sparkles,
  Scissors,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: AmigurumiProject[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onRefreshProjects: () => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onRefreshProjects,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState<'bichinho' | 'polvo' | 'chaveiro' | 'livre'>('bichinho');
  const [newHook, setNewHook] = useState('2.5mm');
  const [newYarn, setNewYarn] = useState('Amigurumi Círculo');

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patternName && p.patternName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const created = StorageService.createProjectFromTemplate(
      newTitle.trim(),
      newTemplate,
      newHook.trim(),
      newYarn.trim()
    );
    onRefreshProjects();
    onSelectProject(created.id);
    setShowNewModal(false);
    setNewTitle('');
    onClose();
  };

  const handleDuplicate = (id: string) => {
    const dup = StorageService.duplicateProject(id);
    if (dup) {
      onRefreshProjects();
      onSelectProject(dup.id);
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o projeto "${title}"?`)) {
      StorageService.deleteProject(id);
      onRefreshProjects();
    }
  };

  const handleExportSingle = (project: AmigurumiProject) => {
    const jsonStr = StorageService.exportProjectAsJson(project);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amigurumi-${project.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAll = () => {
    const jsonStr = StorageService.exportAllProjectsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-todos-amigurumis-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = StorageService.importFromJson(content);
        if (res.success) {
          alert(`Sucesso! ${res.count} projeto(s) importado(s).`);
          onRefreshProjects();
        } else {
          alert('Erro ao importar arquivo: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
                Banco de Projetos Individuais
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {projects.length} projeto(s) salvos no seu banco local seguro
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

        {/* Toolbar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/60 flex flex-wrap items-center gap-2 justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, categoria ou receita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNewModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Novo Projeto
            </button>

            <button
              onClick={handleExportAll}
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold flex items-center gap-1"
              title="Exportar todos os projetos (Backup JSON)"
            >
              <Download className="w-4 h-4" />
            </button>

            <label
              className="p-1.5 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Importar arquivo de projeto ou backup"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>

        {/* Project List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Scissors className="w-12 h-12 mx-auto stroke-1 mb-2 opacity-50" />
              <p className="font-semibold text-sm">Nenhum projeto encontrado</p>
              <p className="text-xs mt-1">Crie um novo projeto acima ou ajuste sua busca.</p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const isActive = p.id === activeProjectId;
              const totalParts = p.parts.length;
              const completedParts = p.parts.filter((pt) => pt.isCompleted).length;
              const percent = totalParts > 0 ? Math.round((completedParts / totalParts) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-400/30'
                      : 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:border-amber-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-base text-stone-900 dark:text-stone-100 font-comfortaa">
                          {p.title}
                        </h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                          {p.category || 'Amigurumi'}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                            Em Aberto
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mt-1 flex-wrap">
                        {p.hookSize && <span>Agulha: {p.hookSize}</span>}
                        {p.yarnBrand && <span>• Fio: {p.yarnBrand}</span>}
                        <span>• {completedParts}/{totalParts} partes prontas ({percent}%)</span>
                      </div>

                      {/* Small parts pills preview */}
                      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {p.parts.slice(0, 5).map((pt) => (
                          <span
                            key={pt.id}
                            className={`text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                              pt.isCompleted
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-stone-100 text-stone-700 dark:bg-stone-700/60 dark:text-stone-300'
                            }`}
                          >
                            {pt.isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-stone-400" />
                            )}
                            {pt.name}
                          </span>
                        ))}
                        {p.parts.length > 5 && (
                          <span className="text-[11px] text-stone-400 font-medium">
                            +{p.parts.length - 5} mais
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onSelectProject(p.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        Abrir
                      </button>

                      <button
                        onClick={() => handleDuplicate(p.id)}
                        className="p-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        title="Duplicar projeto"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleExportSingle(p)}
                        className="p-1.5 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        title="Exportar arquivo deste projeto (.json)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        className="p-1.5 text-stone-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                        title="Excluir projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create Modal Sub-dialog */}
        {showNewModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-extrabold text-lg text-stone-800 dark:text-stone-100 font-comfortaa flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Criar Novo Amigurumi
                </h4>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNew} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                    Nome do Projeto:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ursinho Teddy, Dinossauro Rex, Girafinha..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-bold text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1.5">
                    Modelo de Peças (Template):
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setNewTemplate('bichinho')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newTemplate === 'bichinho'
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      🧸 Bichinho Clássico
                      <span className="block text-[10px] opacity-80 mt-0.5">Cabeça, Corpo, Braços, Pernas, Orelhas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewTemplate('polvo')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newTemplate === 'polvo'
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      🐙 Polvo Sensorial
                      <span className="block text-[10px] opacity-80 mt-0.5">Cabeça e 8 Tentáculos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewTemplate('chaveiro')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newTemplate === 'chaveiro'
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      🔑 Chaveiro / Mini
                      <span className="block text-[10px] opacity-80 mt-0.5">Peça Principal e Alça</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewTemplate('livre')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        newTemplate === 'livre'
                          ? 'bg-amber-500 text-white border-amber-600 font-bold shadow-sm'
                          : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      ✨ Em Branco
                      <span className="block text-[10px] opacity-80 mt-0.5">Começar do zero</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                      Agulha:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 2.5mm"
                      value={newHook}
                      onChange={(e) => setNewHook(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 mb-1">
                      Fio Principal:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Amigurumi Círculo"
                      value={newYarn}
                      onChange={(e) => setNewYarn(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20"
                  >
                    Criar Projeto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
