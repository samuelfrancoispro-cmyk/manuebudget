import React from "react";
import type { WidgetType, WidgetColSpan, WidgetRowSpan } from "@/types";
import { WidgetSolde } from "./widgets/WidgetSolde";
import { WidgetEpargne } from "./widgets/WidgetEpargne";
import { WidgetKPIMensuel } from "./widgets/WidgetKPIMensuel";
import { WidgetKPIPrevisionnel } from "./widgets/WidgetKPIPrevisionnel";
import { WidgetEvolution } from "./widgets/WidgetEvolution";
import { WidgetForecast } from "./widgets/WidgetForecast";
import { WidgetProchaines } from "./widgets/WidgetProchaines";
import { WidgetCategories } from "./widgets/WidgetCategories";
import { WidgetObjectifs } from "./widgets/WidgetObjectifs";

export interface WidgetMeta {
  type: WidgetType;
  label: string;
  description: string;
  defaultColSpan: WidgetColSpan;
  defaultRowSpan: WidgetRowSpan;
  component: React.ComponentType<{ config: Record<string, unknown> }>;
}

export const WIDGET_REGISTRY: Record<WidgetType, WidgetMeta> = {
  kpi_solde: {
    type: "kpi_solde",
    label: "Solde courant",
    description: "Solde agrégé de tes comptes courants",
    defaultColSpan: 2,
    defaultRowSpan: 1,
    component: WidgetSolde as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  kpi_epargne: {
    type: "kpi_epargne",
    label: "Épargne totale",
    description: "Total de tous tes comptes épargne",
    defaultColSpan: 2,
    defaultRowSpan: 1,
    component: WidgetEpargne as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  kpi_mensuel: {
    type: "kpi_mensuel",
    label: "Mois réel",
    description: "Revenus et dépenses réels du mois courant",
    defaultColSpan: 2,
    defaultRowSpan: 1,
    component: WidgetKPIMensuel as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  kpi_previsionnel: {
    type: "kpi_previsionnel",
    label: "Prévisionnel",
    description: "Revenus et dépenses prévus (récurrentes)",
    defaultColSpan: 2,
    defaultRowSpan: 1,
    component: WidgetKPIPrevisionnel as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  chart_evolution: {
    type: "chart_evolution",
    label: "Évolution solde",
    description: "Courbe du solde sur 6 mois",
    defaultColSpan: 2,
    defaultRowSpan: 2,
    component: WidgetEvolution as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  chart_forecast: {
    type: "chart_forecast",
    label: "Prévisions 3 mois",
    description: "Graphique revenus / dépenses prévisionnels sur 3 mois",
    defaultColSpan: 2,
    defaultRowSpan: 2,
    component: WidgetForecast as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  chart_categories: {
    type: "chart_categories",
    label: "Répartition",
    description: "Top 5 catégories de dépenses du mois",
    defaultColSpan: 2,
    defaultRowSpan: 1,
    component: WidgetCategories as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  list_prochaines: {
    type: "list_prochaines",
    label: "Prochaines échéances",
    description: "Prochains paiements et virements récurrents",
    defaultColSpan: 2,
    defaultRowSpan: 1,
    component: WidgetProchaines as React.ComponentType<{ config: Record<string, unknown> }>,
  },
  list_objectifs: {
    type: "list_objectifs",
    label: "Objectifs épargne",
    description: "Progression de tes objectifs d'épargne",
    defaultColSpan: 4,
    defaultRowSpan: 1,
    component: WidgetObjectifs as React.ComponentType<{ config: Record<string, unknown> }>,
  },
};
