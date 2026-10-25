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
  totalTimeSeconds?: number;
  isTimerRunning?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuickCounter {
  currentRound: number;
  targetRounds: number;
  currentStitch: number;
  targetStitches: number;
  roundHistory?: Record<number, number>;
  roundTargets?: Record<number, number>;
  colorReminders: ColorReminder[];
  notes?: string;
  totalTimeSeconds?: number;
  isTimerRunning?: boolean;
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

export interface YarnItem {
  id: string;
  brand: string;
  colorName: string;
  colorCode: string;
  lotNumber?: string;
  quantityStatus: 'full' | 'half' | 'scraps';
  colorHex: string;
  notes?: string;
  createdAt: string;
}

export interface PricingCalculation {
  id: string;
  pieceName: string;
  timeSeconds: number;
  hourlyRate: number;
  yarnCost: number;
  fillingCost: number;
  eyesCost: number;
  accessoriesCost: number;
  packagingCost: number;
  profitMarginPercent: number;
  totalLaborCost: number;
  totalMaterialsCost: number;
  suggestedPrice: number;
  createdAt: string;
}
