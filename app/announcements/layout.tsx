// app/announcements/layout.tsx
import '../globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/lib/auth';
import MyNavbar from '@/components/ui/navbar';

export const metadata: Metadata = {
  title: 'Flight Information - Flight Announcements System',
  description: 'Real-time flight information and automated announcements system',
};

export default function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-white dark:bg-gray-950 text-black dark:text-white">
      <body className="min-h-[100dvh] bg-gray-50">
        <div className="flex flex-col min-h-screen">
          <MyNavbar />
          <main className="flex-grow">
            {children}
          </main>
          <footer className="py-4 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} Flight Announcements System</p>
          </footer>
        </div>
      </body>
    </html>
  );
}