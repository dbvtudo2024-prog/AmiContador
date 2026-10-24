import { AmigurumiProject, AppSettings, ProjectPart, SupabaseConfig, QuickCounter } from '../types/amigurumi';

const PROJECTS_STORAGE_KEY = 'amicontador_projects_v1';
const ACTIVE_PROJECT_ID_KEY = 'amicontador_active_project_id';
const SETTINGS_STORAGE_KEY = 'amicontador_settings_v1';
const SUPABASE_CONFIG_KEY = 'amicontador_supabase_config_v1';
const QUICK_COUNTER_STORAGE_KEY = 'amicontador_quick_counter_v1';

export const DEFAULT_QUICK_COUNTER: QuickCounter = {
  currentRound: 1,
  targetRounds: 0,
  currentStitch: 0,
  targetStitches: 0,
  colorReminders: [],
  notes: '',
};

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  soundVolume: 0.7,
  vibrationEnabled: true,
  keepAwake: false,
  autoAdvanceRound: false,
  showStitchCounter: true,
  theme: 'warm-yarn',
};

export const DEFAULT_SUPABASE_CONFIG: SupabaseConfig = {
  url: '',
  anonKey: '',
  tableName: 'amigurumi_projects',
  isEnabled: false,
  lastSyncedAt: null,
};

// Initial starter projects so user has complete examples with parts and color changes right away
export const SEED_PROJECTS: AmigurumiProject[] = [
  {
    id: 'proj_ursinho_caramelo',
    title: 'Ursinho Caramelo',
    patternName: 'Clássico Amigurumi Brasil',
    hookSize: '2.5mm',
    yarnBrand: 'Amigurumi Círculo (Caramelo 7569 / Branco 8001 / Mostarda)',
    category: 'Bichinhos',
    notes: 'Olhos com trava de segurança 9mm colocados entre as voltas 14 e 15 da cabeça. Encher bem com fibra siliconada.',
    status: 'active',
    activePartId: 'part_cabeca',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    parts: [
      {
        id: 'part_cabeca',
        name: 'Cabeça',
        targetRounds: 26,
        currentRound: 14,
        currentStitch: 18,
        targetStitches: 42,
        isCompleted: false,
        order: 1,
        notes: 'Encher firmemente antes das diminuições finais.',
        colorReminders: [
          {
            id: 'cr_1',
            round: 1,
            colorName: 'Caramelo Principal',
            colorHex: '#C68642',
            note: 'Iniciar anel mágico com fio Caramelo',
          },
          {
            id: 'cr_2',
            round: 14,
            colorName: 'Faixa Touquinha Mostarda',
            colorHex: '#EAB308',
            note: 'Trocar para Mostarda na última laçada da volta 13',
          },
          {
            id: 'cr_3',
            round: 18,
            colorName: 'Branco Neve',
            colorHex: '#F8FAFC',
            note: 'Voltar para Branco para a borda fofa da touca',
          },
        ],
        roundInstructions: {
          1: '6 pb no anel mágico [6]',
          2: '6 aum [12]',
          3: '[1 pb, 1 aum] x 6 [18]',
          4: '[2 pb, 1 aum] x 6 [24]',
          5: '[3 pb, 1 aum] x 6 [30]',
          6: '[4 pb, 1 aum] x 6 [36]',
          7: '[5 pb, 1 aum] x 6 [42]',
          8: '42 pb ponto sobre ponto [42]',
          9: '42 pb ponto sobre ponto [42]',
          10: '42 pb ponto sobre ponto [42]',
          11: '42 pb ponto sobre ponto [42]',
          12: '42 pb ponto sobre ponto [42]',
          13: '42 pb ponto sobre ponto [42]',
          14: '42 pb ponto sobre ponto (troca de cor) [42]',
          15: '42 pb ponto sobre ponto [42]',
        },
      },
      {
        id: 'part_focinho',
        name: 'Focinho',
        targetRounds: 6,
        currentRound: 6,
        currentStitch: 18,
        targetStitches: 18,
        isCompleted: true,
        order: 2,
        notes: 'Bordar o nariz em formato de triângulo invertido com fio preto.',
        colorReminders: [
          {
            id: 'cr_foc',
            round: 1,
            colorName: 'Branco Off-White',
            colorHex: '#F5F5F0',
            note: 'Focinho todo em branco',
          },
        ],
      },
      {
        id: 'part_corpo',
        name: 'Corpo',
        targetRounds: 22,
        currentRound: 1,
        currentStitch: 0,
        targetStitches: 6,
        isCompleted: false,
        order: 3,
        notes: 'Unir com a cabeça com ponto invisível ou costura reforçada.',
        colorReminders: [
          {
            id: 'cr_corpo_1',
            round: 1,
            colorName: 'Caramelo',
            colorHex: '#C68642',
            note: 'Base do corpo',
          },
          {
            id: 'cr_corpo_2',
            round: 10,
            colorName: 'Azul Bebê (Suéter)',
            colorHex: '#60A5FA',
            note: 'Início das listras do suéter',
          },
        ],
      },
      {
        id: 'part_bracos',
        name: 'Braços (2x)',
        targetRounds: 16,
        currentRound: 1,
        currentStitch: 0,
        targetStitches: 6,
        isCompleted: false,
        order: 4,
        notes: 'Não encher muito o topo para não ficarem abertos.',
        colorReminders: [],
      },
      {
        id: 'part_pernas',
        name: 'Pernas (2x)',
        targetRounds: 18,
        currentRound: 1,
        currentStitch: 0,
        targetStitches: 6,
        isCompleted: false,
        order: 5,
        notes: 'Encher os pezinhos com firmeza.',
        colorReminders: [],
      },
      {
        id: 'part_orelhas',
        name: 'Orelhas (2x)',
        targetRounds: 6,
        currentRound: 1,
        currentStitch: 0,
        targetStitches: 6,
        isCompleted: false,
        order: 6,
        notes: 'Costurar curvas na lateral da cabeça.',
        colorReminders: [],
      },
    ],
  },
  {
    id: 'proj_polvo_neonatal',
    title: 'Polvinho Sensorial',
    patternName: 'Projeto Octo / Bebê Conforto',
    hookSize: '2.5mm',
    yarnBrand: '100% Algodão Mercerizado Lavável',
    category: 'Sensorial',
    notes: 'Atenção aos tentáculos: esticados não devem passar de 22cm por segurança infantil!',
    status: 'active',
    activePartId: 'part_polvo_cabeca',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    parts: [
      {
        id: 'part_polvo_cabeca',
        name: 'Cabeça do Polvo',
        targetRounds: 24,
        currentRound: 8,
        currentStitch: 12,
        targetStitches: 36,
        isCompleted: false,
        order: 1,
        colorReminders: [
          {
            id: 'cr_p1',
            round: 1,
            colorName: 'Verde Menta Pastel',
            colorHex: '#34D399',
            note: 'Tom suave relaxante',
          },
          {
            id: 'cr_p2',
            round: 18,
            colorName: 'Lilás Lavanda',
            colorHex: '#A78BFA',
            note: 'Base dos tentáculos degradê',
          },
        ],
      },
      {
        id: 'part_tentaculos',
        name: '8x Tentáculos Espirais',
        targetRounds: 8,
        currentRound: 3,
        currentStitch: 0,
        targetStitches: 50,
        isCompleted: false,
        order: 2,
        notes: '50 corr, voltar fazendo 3 pb em cada correntinha para espiralar.',
        colorReminders: [],
      },
    ],
  },
];

export const StorageService = {
  // Projects - Starts clean/empty (zerado)
  getAllProjects(): AmigurumiProject[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Remove legacy seed projects if they exist so app stays zerado
        const cleaned = parsed.filter(
          (p) => p.id !== 'proj_ursinho_caramelo' && p.id !== 'proj_polvo_neonatal'
        );
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(cleaned));
        }
        return cleaned;
      }
      return [];
    } catch {
      return [];
    }
  },

  // Quick / Free Counter (Works anytime, with or without projects)
  getQuickCounter(): QuickCounter {
    if (typeof window === 'undefined') return DEFAULT_QUICK_COUNTER;
    try {
      const stored = localStorage.getItem(QUICK_COUNTER_STORAGE_KEY);
      return stored ? { ...DEFAULT_QUICK_COUNTER, ...JSON.parse(stored) } : DEFAULT_QUICK_COUNTER;
    } catch {
      return DEFAULT_QUICK_COUNTER;
    }
  },

  saveQuickCounter(counter: QuickCounter): QuickCounter {
    if (typeof window === 'undefined') return counter;
    localStorage.setItem(QUICK_COUNTER_STORAGE_KEY, JSON.stringify(counter));
    return counter;
  },

  resetQuickCounter(): QuickCounter {
    if (typeof window === 'undefined') return DEFAULT_QUICK_COUNTER;
    localStorage.setItem(QUICK_COUNTER_STORAGE_KEY, JSON.stringify(DEFAULT_QUICK_COUNTER));
    return DEFAULT_QUICK_COUNTER;
  },

  convertQuickCounterToProject(title: string, counter: QuickCounter): AmigurumiProject {
    const projectId = 'proj_' + Math.random().toString(36).substring(2, 9);
    const partId = 'part_' + Math.random().toString(36).substring(2, 8);

    const newProject: AmigurumiProject = {
      id: projectId,
      title: title.trim() || 'Meu Amigurumi',
      patternName: '',
      hookSize: '2.5mm',
      yarnBrand: '',
      category: 'Geral',
      notes: counter.notes || '',
      status: 'active',
      activePartId: partId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parts: [
        {
          id: partId,
          name: 'Peça Principal',
          targetRounds: counter.targetRounds || Math.max(counter.currentRound, 20),
          currentRound: counter.currentRound,
          currentStitch: counter.currentStitch,
          targetStitches: counter.targetStitches || 6,
          isCompleted: false,
          order: 1,
          colorReminders: counter.colorReminders || [],
          notes: counter.notes,
        },
      ],
    };

    return this.saveProject(newProject);
  },

  getActiveProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  },

  setActiveProjectId(id: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  },

  saveProject(project: AmigurumiProject): AmigurumiProject {
    const projects = this.getAllProjects();
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = updatedProject;
    } else {
      projects.unshift(updatedProject);
    }
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    return updatedProject;
  },

  deleteProject(id: string): boolean {
    const projects = this.getAllProjects();
    const filtered = projects.filter((p) => p.id !== id);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(filtered));

    // If active was deleted, point to another one
    if (this.getActiveProjectId() === id) {
      if (filtered.length > 0) {
        this.setActiveProjectId(filtered[0].id);
      } else {
        localStorage.removeItem(ACTIVE_PROJECT_ID_KEY);
      }
    }
    return true;
  },

  duplicateProject(id: string): AmigurumiProject | null {
    const projects = this.getAllProjects();
    const target = projects.find((p) => p.id === id);
    if (!target) return null;

    const newId = 'proj_' + Math.random().toString(36).substring(2, 9);
    const duplicated: AmigurumiProject = {
      ...target,
      id: newId,
      title: `${target.title} (Cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parts: target.parts.map((part) => ({
        ...part,
        id: 'part_' + Math.random().toString(36).substring(2, 9),
      })),
    };
    if (duplicated.parts.length > 0) {
      duplicated.activePartId = duplicated.parts[0].id;
    }

    projects.unshift(duplicated);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    this.setActiveProjectId(newId);
    return duplicated;
  },

  createProjectFromTemplate(
    title: string,
    templateType: 'bichinho' | 'polvo' | 'chaveiro' | 'livre',
    hookSize = '2.5mm',
    yarnBrand = 'Amigurumi Círculo'
  ): AmigurumiProject {
    const projectId = 'proj_' + Math.random().toString(36).substring(2, 9);

    let parts: ProjectPart[] = [];

    if (templateType === 'bichinho') {
      parts = [
        {
          id: 'p_head_' + Math.random().toString(36).substring(2, 6),
          name: 'Cabeça',
          targetRounds: 24,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 1,
          colorReminders: [
            {
              id: 'cr_' + Math.random().toString(36).substring(2, 6),
              round: 1,
              colorName: 'Cor Principal',
              colorHex: '#F59E0B',
              note: 'Anel mágico com fio principal',
            },
          ],
        },
        {
          id: 'p_body_' + Math.random().toString(36).substring(2, 6),
          name: 'Corpo',
          targetRounds: 20,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 2,
          colorReminders: [],
        },
        {
          id: 'p_arms_' + Math.random().toString(36).substring(2, 6),
          name: 'Braços (2x)',
          targetRounds: 14,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 3,
          colorReminders: [],
        },
        {
          id: 'p_legs_' + Math.random().toString(36).substring(2, 6),
          name: 'Pernas (2x)',
          targetRounds: 16,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 4,
          colorReminders: [],
        },
        {
          id: 'p_ears_' + Math.random().toString(36).substring(2, 6),
          name: 'Orelhas (2x)',
          targetRounds: 6,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 5,
          colorReminders: [],
        },
      ];
    } else if (templateType === 'polvo') {
      parts = [
        {
          id: 'p_oct_head_' + Math.random().toString(36).substring(2, 6),
          name: 'Cabeça do Polvo',
          targetRounds: 22,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 1,
          colorReminders: [],
        },
        {
          id: 'p_oct_tentacles_' + Math.random().toString(36).substring(2, 6),
          name: '8x Tentáculos',
          targetRounds: 8,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 45,
          isCompleted: false,
          order: 2,
          colorReminders: [],
        },
      ];
    } else if (templateType === 'chaveiro') {
      parts = [
        {
          id: 'p_key_main_' + Math.random().toString(36).substring(2, 6),
          name: 'Peça Principal',
          targetRounds: 12,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 1,
          colorReminders: [],
        },
        {
          id: 'p_key_acc_' + Math.random().toString(36).substring(2, 6),
          name: 'Detalhe / Alça',
          targetRounds: 4,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 2,
          colorReminders: [],
        },
      ];
    } else {
      parts = [
        {
          id: 'p_custom_' + Math.random().toString(36).substring(2, 6),
          name: 'Peça 1',
          targetRounds: 20,
          currentRound: 1,
          currentStitch: 0,
          targetStitches: 6,
          isCompleted: false,
          order: 1,
          colorReminders: [],
        },
      ];
    }

    const newProject: AmigurumiProject = {
      id: projectId,
      title: title || 'Novo Amigurumi',
      patternName: '',
      hookSize,
      yarnBrand,
      category: templateType === 'bichinho' ? 'Bichinhos' : templateType === 'polvo' ? 'Sensorial' : 'Geral',
      notes: '',
      status: 'active',
      activePartId: parts[0].id,
      parts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveProject(newProject);
  },

  // Settings
  getSettings(): AppSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: AppSettings) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  },

  // Supabase Config
  getSupabaseConfig(): SupabaseConfig {
    if (typeof window === 'undefined') return DEFAULT_SUPABASE_CONFIG;
    try {
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      return stored ? { ...DEFAULT_SUPABASE_CONFIG, ...JSON.parse(stored) } : DEFAULT_SUPABASE_CONFIG;
    } catch {
      return DEFAULT_SUPABASE_CONFIG;
    }
  },

  saveSupabaseConfig(config: SupabaseConfig) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  },

  // Export / Import
  exportProjectAsJson(project: AmigurumiProject): string {
    return JSON.stringify(project, null, 2);
  },

  exportAllProjectsAsJson(): string {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projects: this.getAllProjects(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  importFromJson(jsonContent: string): { success: boolean; count: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      let importedProjects: AmigurumiProject[] = [];

      if (parsed && Array.isArray(parsed.projects)) {
        importedProjects = parsed.projects;
      } else if (parsed && parsed.id && parsed.title && Array.isArray(parsed.parts)) {
        // Single project format
        importedProjects = [parsed];
      } else {
        return { success: false, count: 0, error: 'Formato de arquivo inválido' };
      }

      const existing = this.getAllProjects();
      const existingMap = new Map(existing.map((p) => [p.id, p]));

      importedProjects.forEach((proj) => {
        existingMap.set(proj.id, proj);
      });

      const merged = Array.from(existingMap.values());
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(merged));
      if (importedProjects.length > 0) {
        this.setActiveProjectId(importedProjects[0].id);
      }
      return { success: true, count: importedProjects.length };
    } catch (err) {
      return { success: false, count: 0, error: err instanceof Error ? err.message : 'Erro ao importar' };
    }
  },

  // Encode compact project payload for sharing via QR code or link
  encodeForSharing(project: AmigurumiProject): string {
    const compact = {
      i: project.id,
      t: project.title,
      h: project.hookSize,
      y: project.yarnBrand,
      p: project.parts.map((pt) => ({
        id: pt.id,
        n: pt.name,
        tr: pt.targetRounds,
        cr: pt.currentRound,
        cs: pt.currentStitch,
        ts: pt.targetStitches,
        c: pt.isCompleted ? 1 : 0,
        r: pt.colorReminders.map((cr) => ({
          d: cr.round,
          n: cr.colorName,
          h: cr.colorHex,
          t: cr.note || '',
        })),
      })),
      a: project.activePartId,
    };
    try {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(compact)))));
    } catch {
      return encodeURIComponent(btoa(JSON.stringify(compact)));
    }
  },

  decodeFromSharePayload(payload: string): AmigurumiProject | null {
    try {
      const decodedStr = decodeURIComponent(escape(atob(decodeURIComponent(payload))));
      const compact = JSON.parse(decodedStr);
      if (!compact || !compact.t || !Array.isArray(compact.p)) return null;

      const project: AmigurumiProject = {
        id: compact.i || 'proj_' + Math.random().toString(36).substring(2, 9),
        title: compact.t,
        patternName: '',
        hookSize: compact.h || '2.5mm',
        yarnBrand: compact.y || '',
        category: 'Importado',
        notes: '',
        status: 'active',
        activePartId: compact.a || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        parts: compact.p.map((pt: any, idx: number) => ({
          id: pt.id || 'part_' + idx,
          name: pt.n || `Parte ${idx + 1}`,
          targetRounds: Number(pt.tr) || 20,
          currentRound: Number(pt.cr) || 1,
          currentStitch: Number(pt.cs) || 0,
          targetStitches: Number(pt.ts) || 6,
          isCompleted: Boolean(pt.c),
          order: idx + 1,
          colorReminders: (pt.r || []).map((cr: any, cidx: number) => ({
            id: 'cr_' + cidx,
            round: Number(cr.d) || 1,
            colorName: cr.n || 'Nova Cor',
            colorHex: cr.h || '#F59E0B',
            note: cr.t || '',
          })),
        })),
      };

      if (!project.activePartId && project.parts.length > 0) {
        project.activePartId = project.parts[0].id;
      }

      return project;
    } catch {
      return null;
    }
  },
};
