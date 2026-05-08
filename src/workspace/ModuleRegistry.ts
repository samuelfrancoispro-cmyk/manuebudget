import type { LucideIcon } from 'lucide-react';
import {
  Wallet, TrendingUp, PiggyBank, Calculator, BarChart2,
  LineChart, Building2, CreditCard, Receipt, Users,
  Briefcase, Globe
} from 'lucide-react';
import type { ModuleKey } from '@/types';
import type { TierId } from '@/lib/pricing';

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  icon: LucideIcon;
  description: string;
  defaultActive: boolean;
  requiredTier: TierId;
  route: string | null;
  navEntry: boolean;
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: 'budget',
    name: 'Budget',
    icon: Wallet,
    description: 'Suis tes dépenses par catégorie, gère tes comptes courants et tes récurrentes mois par mois.',
    defaultActive: true,
    requiredTier: 'free',
    route: '/argent',
    navEntry: true,
  },
  {
    key: 'forecast',
    name: 'Forecast',
    icon: TrendingUp,
    description: 'Prévois tes revenus et dépenses sur 30 à 90 jours grâce à tes habitudes passées.',
    defaultActive: true,
    requiredTier: 'free',
    route: null,
    navEntry: true,
  },
  {
    key: 'epargne',
    name: 'Épargne',
    icon: PiggyBank,
    description: 'Gère tes comptes épargne, suis tes objectifs et visualise ta progression.',
    defaultActive: true,
    requiredTier: 'free',
    route: '/epargne',
    navEntry: true,
  },
  {
    key: 'simulateur',
    name: 'Simulateur',
    icon: Calculator,
    description: "Simule tes projets d'achat avec une timeline d'achats datés et une épargne projetée.",
    defaultActive: true,
    requiredTier: 'free',
    route: null,
    navEntry: true,
  },
  {
    key: 'rapports',
    name: 'Rapports',
    icon: BarChart2,
    description: 'Analyse tes finances avec des graphiques par catégorie, période et compte.',
    defaultActive: true,
    requiredTier: 'free',
    route: '/rapports',
    navEntry: true,
  },
  {
    key: 'investissements',
    name: 'Investissements',
    icon: LineChart,
    description: 'Suis tes positions PEA, CTO, assurance-vie et SCPI avec performance en temps réel.',
    defaultActive: false,
    requiredTier: 'plus',
    route: null,
    navEntry: true,
  },
  {
    key: 'patrimoine',
    name: 'Patrimoine',
    icon: Building2,
    description: 'Calcule ton net worth, score de santé financière et visualise ta timeline de vie.',
    defaultActive: false,
    requiredTier: 'plus',
    route: null,
    navEntry: true,
  },
  {
    key: 'dettes',
    name: 'Dettes & Emprunts',
    icon: CreditCard,
    description: 'Amortis tes crédits, planifie le désendettement et gamifie ta progression.',
    defaultActive: false,
    requiredTier: 'plus',
    route: null,
    navEntry: true,
  },
  {
    key: 'fiscalite',
    name: 'Fiscalité',
    icon: Receipt,
    description: 'Estime ton IR, TMI, plus-values et optimise tes plafonds PER et livrets.',
    defaultActive: false,
    requiredTier: 'pro',
    route: null,
    navEntry: true,
  },
  {
    key: 'duo',
    name: 'Duo',
    icon: Users,
    description: 'Gère un budget partagé avec ton partenaire, suivi des dépenses communes.',
    defaultActive: false,
    requiredTier: 'plus',
    route: null,
    navEntry: true,
  },
  {
    key: 'freelance',
    name: 'Freelance',
    icon: Briefcase,
    description: 'Suivi CA irrégulier, cotisations, facturation et trésorerie freelance.',
    defaultActive: false,
    requiredTier: 'plus',
    route: null,
    navEntry: true,
  },
  {
    key: 'multidevise',
    name: 'Multi-devise',
    icon: Globe,
    description: 'Gère tes comptes en plusieurs devises avec taux de change automatiques.',
    defaultActive: false,
    requiredTier: 'pro',
    route: null,
    navEntry: true,
  },
];

export const DEFAULT_ACTIVE_MODULES: ModuleKey[] = MODULE_REGISTRY
  .filter((m) => m.defaultActive)
  .map((m) => m.key);

export const OPTIONAL_MODULES: ModuleDefinition[] = MODULE_REGISTRY.filter((m) => !m.defaultActive);
export const DEFAULT_MODULES: ModuleDefinition[] = MODULE_REGISTRY.filter((m) => m.defaultActive);

export function getModule(key: ModuleKey): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.key === key);
}
