import React, { useState } from 'react';
import { SupabaseConfig, AmigurumiProject } from '../types/amigurumi';
import { StorageService } from '../services/storage';
import { SupabaseService } from '../services/supabase';
import { X, Database, Check, Copy, ArrowUpCircle, ArrowDownCircle, RefreshCw, Key, Globe, ShieldCheck } from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: AmigurumiProject;
  onRefreshProjects: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onRefreshProjects,
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(StorageService.getSupabaseConfig());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    StorageService.saveSupabaseConfig(config);
    setSyncStatus('Configurações salvas localmente!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!config.url || !config.anonKey) {
      setTestResult({ success: false, message: 'Preencha a URL e a Anon Key do seu Supabase.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const result = await SupabaseService.testConnection(config.url, config.anonKey, config.tableName);
    setTesting(false);
    setTestResult(result);
    if (result.success) {
      const updated = { ...config, isEnabled: true };
      setConfig(updated);
      StorageService.saveSupabaseConfig(updated);
    }
  };

  const handlePushCurrentProject = async () => {
    setSyncing(true);
    setSyncStatus('Enviando projeto ao Supabase...');
    const res = await SupabaseService.pushProject(currentProject, config);
    setSyncing(false);
    if (res.success) {
      const updated = { ...config, lastSyncedAt: new Date().toISOString() };
      setConfig(updated);
      StorageService.saveSupabaseConfig(updated);
      setSyncStatus('Projeto enviado e sincronizado com o Supabase com sucesso!');
    } else {
      setSyncStatus('Erro ao enviar: ' + res.error);
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handlePullProjects = async () => {
    setSyncing(true);
    setSyncStatus('Baixando projetos do Supabase...');
    const res = await SupabaseService.pullAllProjects(config);
    setSyncing(false);
    if (res.success && res.projects) {
      const jsonStr = JSON.stringify({ projects: res.projects });
      StorageService.importFromJson(jsonStr);
      onRefreshProjects();
      setSyncStatus(`Sucesso! ${res.projects.length} projeto(s) carregados do Supabase.`);
    } else {
      setSyncStatus('Erro ao baixar: ' + res.error);
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const handleCopySql = () => {
    const sql = SupabaseService.getSqlTableScript(config.tableName || 'amigurumi_projects');
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-800 dark:text-stone-100 font-comfortaa">
                Sincronização em Nuvem (Supabase)
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Opcional • Conecte seu próprio banco de dados Supabase gratuito
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
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
            <span className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Seus dados sob seu total controle:
            </span>
            Por padrão, todos os projetos ficam salvos no navegador (PC ou celular). Se desejar sincronizar na nuvem, basta colar sua URL e Chave Anônima do Supabase abaixo!
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-400" /> URL do Projeto Supabase:
              </label>
              <input
                type="url"
                placeholder="https://exemplo-id.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-400" /> Supabase Anon Key (Public Key):
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.anonKey}
                onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 dark:text-stone-300">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                Ativar sincronização Supabase
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  disabled={testing || !config.url || !config.anonKey}
                  onClick={handleTestConnection}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Testar Conexão
                </button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  testResult.success
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300'
                    : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-300'
                }`}
              >
                {testResult.message}
              </div>
            )}

            {syncStatus && (
              <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-semibold text-center animate-fade-in">
                {syncStatus}
              </div>
            )}
          </div>

          {/* Cloud actions */}
          {config.url && config.anonKey && (
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                Ações de Sincronização
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handlePushCurrentProject}
                  disabled={syncing}
                  className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-400 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                  Enviar Projeto Atual
                </button>

                <button
                  onClick={handlePullProjects}
                  disabled={syncing}
                  className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-400 text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <ArrowDownCircle className="w-4 h-4 text-purple-500" />
                  Puxar da Nuvem
                </button>
              </div>
            </div>
          )}

          {/* SQL Helper */}
          <div className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Script SQL da Tabela (Supabase)
              </span>
              <button
                onClick={handleCopySql}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedSql ? 'Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            <pre className="p-3 bg-stone-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-36">
              {SupabaseService.getSqlTableScript(config.tableName || 'amigurumi_projects')}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex justify-end bg-stone-50/50 dark:bg-stone-800/30">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
