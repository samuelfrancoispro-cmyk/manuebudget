import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Comptes from "./Comptes";
import Transactions from "./Transactions";
import Recurrents from "./Recurrents";

const TABS = ["comptes", "transactions", "recurrents"] as const;
type Tab = (typeof TABS)[number];

export default function ArgentPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const initial: Tab = TABS.includes(raw as Tab) ? (raw as Tab) : "comptes";

  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    next.set("tab", v);
    setParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title={t("argent.title")}
        description={t("argent.description")}
      />

      <Tabs value={initial} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="comptes">Comptes courants</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="recurrents">Récurrents</TabsTrigger>
        </TabsList>

        <TabsContent value="comptes" className="mt-4">
          <Comptes embedded />
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <Transactions embedded />
        </TabsContent>
        <TabsContent value="recurrents" className="mt-4">
          <Recurrents embedded />
        </TabsContent>
      </Tabs>
    </>
  );
}
