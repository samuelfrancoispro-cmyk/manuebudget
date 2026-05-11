import type { ModuleKey, Tier } from '@/types';

export type ModuleStatus = 'mvp' | 'available' | 'soon';
export type ModuleCategory = 'apercu' | 'budget' | 'epargne' | 'investissement' | 'fiscal' | 'collaboration';

export type ModuleMeta = {
  key: ModuleKey;
  labelKey: string;
  descKey: string;
  category: ModuleCategory;
  tier: Tier;
  minW: number; minH: number;
  defaultW: number; defaultH: number;
  status: ModuleStatus;
};

export const MODULE_CATALOGUE: ModuleMeta[] = [
  { key: 'solde',            labelKey: 'modules.solde.name',       descKey: 'modules.solde.desc',       category: 'apercu',         tier: 'free', minW: 240, minH: 160, defaultW: 320, defaultH: 200, status: 'mvp'  },
  { key: 'kpi-mensuel',      labelKey: 'modules.kpi.name',         descKey: 'modules.kpi.desc',         category: 'apercu',         tier: 'free', minW: 200, minH: 150, defaultW: 280, defaultH: 180, status: 'soon' },
  { key: 'net-worth',        labelKey: 'modules.networth.name',    descKey: 'modules.networth.desc',    category: 'apercu',         tier: 'plus', minW: 240, minH: 160, defaultW: 320, defaultH: 200, status: 'soon' },
  { key: 'depenses',         labelKey: 'modules.depenses.name',    descKey: 'modules.depenses.desc',    category: 'budget',         tier: 'free', minW: 280, minH: 200, defaultW: 360, defaultH: 280, status: 'mvp'  },
  { key: 'recurrentes',      labelKey: 'modules.recurrentes.name', descKey: 'modules.recurrentes.desc', category: 'budget',         tier: 'free', minW: 260, minH: 180, defaultW: 340, defaultH: 260, status: 'mvp'  },
  { key: 'categories',       labelKey: 'modules.categories.name',  descKey: 'modules.categories.desc',  category: 'budget',         tier: 'free', minW: 260, minH: 200, defaultW: 340, defaultH: 260, status: 'soon' },
  { key: 'objectif-epargne', labelKey: 'modules.objectif.name',    descKey: 'modules.objectif.desc',    category: 'epargne',        tier: 'free', minW: 260, minH: 180, defaultW: 320, defaultH: 240, status: 'mvp'  },
  { key: 'pots',             labelKey: 'modules.pots.name',        descKey: 'modules.pots.desc',        category: 'epargne',        tier: 'plus', minW: 240, minH: 180, defaultW: 320, defaultH: 240, status: 'soon' },
  { key: 'projets',          labelKey: 'modules.projets.name',     descKey: 'modules.projets.desc',     category: 'epargne',        tier: 'plus', minW: 260, minH: 200, defaultW: 340, defaultH: 260, status: 'soon' },
  { key: 'pea-cto',          labelKey: 'modules.peacto.name',      descKey: 'modules.peacto.desc',      category: 'investissement', tier: 'pro',  minW: 280, minH: 200, defaultW: 360, defaultH: 280, status: 'soon' },
  { key: 'performance',      labelKey: 'modules.performance.name', descKey: 'modules.performance.desc', category: 'investissement', tier: 'pro',  minW: 280, minH: 200, defaultW: 360, defaultH: 280, status: 'soon' },
  { key: 'tmi',              labelKey: 'modules.tmi.name',         descKey: 'modules.tmi.desc',         category: 'fiscal',         tier: 'pro',  minW: 240, minH: 160, defaultW: 320, defaultH: 200, status: 'soon' },
  { key: 'ir',               labelKey: 'modules.ir.name',          descKey: 'modules.ir.desc',          category: 'fiscal',         tier: 'pro',  minW: 240, minH: 160, defaultW: 320, defaultH: 200, status: 'soon' },
  { key: 'per',              labelKey: 'modules.per.name',         descKey: 'modules.per.desc',         category: 'fiscal',         tier: 'pro',  minW: 240, minH: 160, defaultW: 320, defaultH: 200, status: 'soon' },
  { key: 'famille',          labelKey: 'modules.famille.name',     descKey: 'modules.famille.desc',     category: 'collaboration',  tier: 'pro',  minW: 280, minH: 200, defaultW: 360, defaultH: 280, status: 'soon' },
  { key: 'partage',          labelKey: 'modules.partage.name',     descKey: 'modules.partage.desc',     category: 'collaboration',  tier: 'pro',  minW: 280, minH: 200, defaultW: 360, defaultH: 280, status: 'soon' },
];

export const MODULE_CATEGORIES: { key: ModuleCategory; labelKey: string }[] = [
  { key: 'apercu',         labelKey: 'modules.cat.apercu'         },
  { key: 'budget',         labelKey: 'modules.cat.budget'         },
  { key: 'epargne',        labelKey: 'modules.cat.epargne'        },
  { key: 'investissement', labelKey: 'modules.cat.investissement' },
  { key: 'fiscal',         labelKey: 'modules.cat.fiscal'         },
  { key: 'collaboration',  labelKey: 'modules.cat.collaboration'  },
];
