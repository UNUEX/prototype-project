// app/[lang]/GlobalModals.tsx
'use client';

import { LimitModal, useLimitModal, GlobalLimitModal, useGlobalLimitModal } from '@/components/LimitModal';
import { useGenerationLimit } from '@/hooks/useGenerationLimit';

export function GlobalModals() {
  const limitModal       = useLimitModal();
  const globalLimitModal = useGlobalLimitModal();
  const { used, dailyLimit } = useGenerationLimit();

  return (
    <>
      <LimitModal
        isOpen={limitModal.isOpen}
        onClose={limitModal.close}
        used={used}
        dailyLimit={dailyLimit}
        eventData={limitModal.eventData}
      />
      <GlobalLimitModal
        isOpen={globalLimitModal.isOpen}
        onClose={globalLimitModal.close}
        eventData={globalLimitModal.eventData}
      />
    </>
  );
}