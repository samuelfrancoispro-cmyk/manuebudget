// src/components/Layout.tsx
import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/store/useStore';
import { FloatingSidebar } from '@/components/FloatingSidebar';
import { MobileDock } from '@/components/MobileDock';
import { createPortalSession } from '@/lib/stripe';

export default function Layout() {
  const { t } = useTranslation();
  const profile = useStore((s) => s.profile);
  const [portalLoading, setPortalLoading] = useState(false);

  const trialExpired =
    !!profile?.trialEndsAt &&
    new Date(profile.trialEndsAt) <= new Date() &&
    !profile?.subscriptionStatus;
  const isPastDue = profile?.subscriptionStatus === 'past_due';

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Desktop sidebar flottante */}
      <FloatingSidebar />

      {/* Dock mobile */}
      <MobileDock />

      {/* Contenu principal */}
      <main className="flex-1 overflow-x-hidden md:ml-[184px]">
        {/* Banner trial expiré */}
        {trialExpired && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <span>{t('subscription.trialExpiredBanner')}</span>
            <Link to="/parametres#abonnement" className="font-medium underline underline-offset-2">
              {t('subscription.trialExpiredCta')}
            </Link>
          </div>
        )}

        {/* Banner paiement échoué */}
        {isPastDue && (
          <div className="flex items-center justify-center gap-2 bg-red-50 px-4 py-2 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
            <span>{t('subscription.pastDueBanner')}</span>
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="font-medium underline underline-offset-2 disabled:opacity-50"
            >
              {t('subscription.pastDueCta')}
            </button>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 md:pb-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
