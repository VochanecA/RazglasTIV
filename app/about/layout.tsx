// app/about/layout.tsx

import '../globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/lib/auth';


export const metadata: Metadata = {
  title: 'About Us - AeroVoice Pro',
  description: 'Learn more about AeroVoice Pro and our airport management services.',
};

export default async function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Uklonite html i body tagove - oni su već definirani u root layout-u
    <div className="min-h-screen bg-white dark:bg-gray-950 text-black dark:text-white">
      <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900">

        {children}
      </div>
    </div>
  );
}