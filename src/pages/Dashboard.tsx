import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { PageTabs } from "@/workspace/PageTabs";
import { DashboardGrid } from "@/workspace/DashboardGrid";
import type { DashboardPage } from "@/types";

export default function Dashboard() {
  const { dashboardPages } = useStore();
  const sorted = useMemo(
    () => [...dashboardPages].sort((a, b) => a.order - b.order),
    [dashboardPages]
  );

  const [activePage, setActivePage] = useState<DashboardPage | null>(null);

  useEffect(() => {
    if (sorted.length > 0 && (!activePage || !sorted.find((p) => p.id === activePage.id))) {
      setActivePage(sorted[0]);
    }
  }, [sorted, activePage]);

  if (sorted.length === 0 || !activePage) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-ink-muted">
        Chargement du workspace…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageTabs pages={sorted} activePage={activePage} onSelect={setActivePage} />
      <DashboardGrid page={activePage} />
    </div>
  );
}
