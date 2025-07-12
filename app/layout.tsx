import './globals.css';
import { Inter as FontSans } from 'next/font/google'; // Using Inter for a modern, readable sans-serif font
import { cn } from '@/lib/utils'; // Utility for class concatenation (e.g., from shadcn/ui)
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import Navbar from '@/components/ui/navbar'; // Assuming default export for Navbar
import { NotificationCenter } from '@/components/ui/NotificationCenter'; // Use named import for NotificationCenter
import ThemeProvider from '@/components/ui/ThemeProvider'; // Assuming default export for ThemeProvider
import { ScreenWakeManager } from '@/components/ScreenWakeManager'; // Import the screen wake manager
import type { Metadata } from 'next';

// Define the primary font with a CSS variable for easy use in Tailwind
const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Metadata for SEO and social sharing
export const metadata: Metadata = {
  title: {
    default: 'AeroVoice by Alen',
    template: '%s | AeroVoice by Alen', // Template for page-specific titles
  },
  description: 'AeroVoice: Your essential Airport PA system for Tivat Airport – never miss an important announcement.',
  keywords: ['AeroVoice', 'Tivat Airport', 'PA system', 'airport announcements', 'flight information', 'Montenegro'],
  authors: [{ name: 'Alen' }],
  creator: 'Alen',
  openGraph: {
    title: 'AeroVoice by Alen',
    description: 'AeroVoice: Your essential Airport PA system for Tivat Airport – never miss an important announcement.',
    url: 'https://aerovoice.com', // Replace with your actual domain
    siteName: 'AeroVoice',
    images: [
      {
        url: 'https://aerovoice.com/og-image.jpg', // Replace with a compelling Open Graph image
        width: 1200,
        height: 630,
        alt: 'AeroVoice Airport PA System',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AeroVoice by Alen',
    description: 'AeroVoice: Your essential Airport PA system for Tivat Airport – never miss an important announcement.',
    creator: '@yourtwitterhandle', // Replace with your Twitter handle
    images: ['https://aerovoice.com/twitter-image.jpg'], // Replace with a compelling Twitter image
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser();
  
  return (
    // suppressHydrationWarning is used here because ThemeProvider will modify the 'class' attribute on the client
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased flex flex-col', // 'bg-background' should be defined in globals.css for light/dark
          fontSans.variable // Apply the font CSS variable
        )}
      >
        <UserProvider userPromise={userPromise}>
          {/* ThemeProvider handles dark/light mode switching based on system/user preference */}
          <ThemeProvider>
            <Navbar />
            <main className="flex-1 overflow-auto"> {/* Main content area that expands and scrolls */}
              {children}
            </main>
            <NotificationCenter />
            {/* Screen Wake Manager - keeps screen active on mobile */}
            <ScreenWakeManager enabled={true} autoStart={true} />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}