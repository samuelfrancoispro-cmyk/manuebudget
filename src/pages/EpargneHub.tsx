import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { totalEpargne } from "@/lib/calculs";
import { formatEUR } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Epargne from "./Epargne";
import Simulateur from "./Simulateur";
import VirementsRecurrentsTab from "@/components/VirementsRecurrentsTab";

const TABS = ["epargne", "virements", "simulateur"] as const;
type Tab = (typeof TABS)[number];

export default function EpargneHub() {
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
        title="Épargne & projets"
        description="Comptes d'épargne, objectifs, virements automatiques et simulations de projet."
        action={
          <Badge variant="outline" className="px-3 py-1.5 text-base">
            Total épargne :{" "}
            <span className="ml-1.5 font-semibold">{formatEUR(total)}</span>
          </Badge>
        }
      />

      <Tabs value={initial} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="epargne">Comptes & objectifs</TabsTrigger>
          <TabsTrigger value="virements">Virements automatiques</TabsTrigger>
          <TabsTrigger value="simulateur">Simulateur & projets</TabsTrigger>
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
