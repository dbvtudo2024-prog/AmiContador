import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AmigurumiProject, SupabaseConfig } from '../types/amigurumi';
import { StorageService } from './storage';

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = StorageService.getSupabaseConfig();
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }
  if (clientInstance && lastUrl === config.url && lastKey === config.anonKey) {
    return clientInstance;
  }
  try {
    clientInstance = createClient(config.url, config.anonKey);
    lastUrl = config.url;
    lastKey = config.anonKey;
    return clientInstance;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export const SupabaseService = {
  getSqlTableScript(tableName = 'amigurumi_projects'): string {
    return `-- Execute este script no SQL Editor do seu projeto Supabase:
create table if not exists public.${tableName} (
  id text primary key,
  title text not null,
  pattern_name text,
  category text,
  status text default 'active',
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar segurança em nível de linha (opcional se anônimo):
alter table public.${tableName} enable row level security;

-- Política de leitura/escrita aberta para sua chave anônima:
create policy "Acesso ao AmiContador"
  on public.${tableName}
  for all
  using (true)
  with check (true);
`;
  },

  async testConnection(url: string, anonKey: string, tableName = 'amigurumi_projects'): Promise<{ success: boolean; message: string }> {
    try {
      const tempClient = createClient(url, anonKey);
      const { error } = await tempClient.from(tableName).select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: `Conectou ao Supabase, mas a tabela "${tableName}" ainda não foi criada. Copie o script SQL abaixo e execute no SQL Editor do Supabase.`,
          };
        }
        return { success: false, message: `Erro no Supabase: ${error.message}` };
      }
      return { success: true, message: 'Conexão com o Supabase realizada com sucesso!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Falha ao conectar com o Supabase' };
    }
  },

  async pushProject(project: AmigurumiProject, config: SupabaseConfig): Promise<{ success: boolean; error?: string }> {
    if (!config.url || !config.anonKey) {
      return { success: false, error: 'Supabase não configurado' };
    }
    try {
      const client = getSupabaseClient() || createClient(config.url, config.anonKey);
      const { error } = await client.from(config.tableName || 'amigurumi_projects').upsert({
        id: project.id,
        title: project.title,
        pattern_name: project.patternName,
        category: project.category,
        status: project.status,
        data: project,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async pullAllProjects(config: SupabaseConfig): Promise<{ success: boolean; projects?: AmigurumiProject[]; error?: string }> {
    if (!config.url || !config.anonKey) {
      return { success: false, error: 'Supabase não configurado' };
    }
    try {
      const client = getSupabaseClient() || createClient(config.url, config.anonKey);
      const { data, error } = await client.from(config.tableName || 'amigurumi_projects').select('data');

      if (error) throw error;
      const projects: AmigurumiProject[] = (data || []).map((row: any) => row.data).filter(Boolean);
      return { success: true, projects };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },
};
