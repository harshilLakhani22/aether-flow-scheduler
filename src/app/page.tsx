'use client';

import { Provider } from 'jotai';
import AppShell from '@/components/AppShell';

export default function Home() {
  return (
    <Provider>
      <AppShell />
    </Provider>
  );
}
