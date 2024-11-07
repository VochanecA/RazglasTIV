// app/pricing/layout.tsx
'use client';

import Navbar from '@/components/ui/navbar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen">
      {/* <Navbar /> */}
      {children}
    </section>
  );
}