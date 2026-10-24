export interface ColorReminder {
  id: string;
  round: number;
  colorName: string;
  colorHex: string;
  note?: string;
}

export interface ProjectPart {
  id: string;
  name: string;
  targetRounds: number;
  currentRound: number;
  currentStitch: number;
  targetStitches: number;
  isCompleted: boolean;
  roundInstructions?: Record<number, string>;
  roundStitches?: Record<number, number>;
  colorReminders: ColorReminder[];
  notes?: string;
  order: number;
}

export interface AmigurumiProject {
  id: string;
  title: string;
  patternName: string;
  hookSize: string;
  yarnBrand: string;
  category: string;
  notes: string;
  parts: ProjectPart[];
  activePartId: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface QuickCounter {
  currentRound: number;
  targetRounds: number;
  currentStitch: number;
  targetStitches: number;
  colorReminders: ColorReminder[];
  notes?: string;
}

export interface AppSettings {
  soundEnabled: boolean;
  soundVolume: number;
  vibrationEnabled: boolean;
  keepAwake: boolean;
  autoAdvanceRound: boolean;
  showStitchCounter: boolean;
  theme: 'warm-yarn' | 'pastel-mint' | 'soft-rose' | 'dark-crochet';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isEnabled: boolean;
  lastSyncedAt: string | null;
}
