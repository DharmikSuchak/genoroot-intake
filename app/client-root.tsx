'use client';

import { useEffect } from 'react';
import { useIntakeStore } from '@/lib/intake-store';

export function ClientRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useIntakeStore.persist.rehydrate();
  }, []);
  return <>{children}</>;
}
