import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useStore } from "@/store/useStore";
import { totalEpargne } from "@/lib/calculs";
import { formatEUR } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KPICard } from "@/components/brand";
import Epargne from "./Epargne";
import Simulateur from "./Simulateur";
import VirementsRecurrentsTab from "@/components/VirementsRecurrentsTab";

const TABS = ["epargne", "virements", "simulateur"] as const;
type Tab = (typeof TABS)[number];

export default function EpargneHub() {
  const { t } = useTranslation();
  const { comptes, mouvements, virementsRecurrents, actifs } = useStore();
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const initial: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "epargne";

  const total = useMemo(
    () => totalEpargne(comptes, mouvements, virementsRecurrents, actifs),
    [comptes, mouvements, virementsRecurrents, actifs]
  );

  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title={t("epargne.title")}
        description={t("epargne.description")}
      />

      <div className="mb-6">
        <KPICard label="Total épargne" value={formatEUR(total)} className="max-w-xs" />
      </div>

      <Tabs value={initial} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="epargne">Comptes &amp; objectifs</TabsTrigger>
          <TabsTrigger value="virements">Virements automatiques</TabsTrigger>
          <TabsTrigger value="simulateur">Simulateur &amp; projets</TabsTrigger>
        </TabsList>

        <TabsContent value="epargne" className="mt-4">
          <Epargne embedded />
        </TabsContent>
        <TabsContent value="virements" className="mt-4">
          <VirementsRecurrentsTab />
        </TabsContent>
        <TabsContent value="simulateur" className="mt-4">
          <Simulateur embedded />
        </TabsContent>
      </Tabs>
    </>
  );
}
