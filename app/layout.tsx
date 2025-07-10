import './globals.css';
import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import Navbar from '@/components/ui/navbar';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import ThemeProvider from '@/components/ui/ThemeProvider'; // Import your ThemeProvider

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AeroVoice by Alen',
  description: 'AeroVoice Airport PA system for Tivat Airport',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser();

  return (
    // MODIFICATION HERE: Added 'dark' class to the html tag
    <html lang="en" className={`${manrope.className} dark`}>
      <body className="min-h-[100dvh] bg-gray-50 flex flex-col">
        <UserProvider userPromise={userPromise}>
          <ThemeProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <NotificationCenter />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
