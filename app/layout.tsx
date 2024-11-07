// app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import Navbar from '@/components/ui/navbar';

// Metadata for the application
export const metadata: Metadata = {
  title: 'Next.js SaaS Starter',
  description: 'Get started quickly with Next.js, Postgres, and Stripe.',
};

// Viewport settings for responsive design
export const viewport: Viewport = {
  maximumScale: 1,
};

// Load the Manrope font
const manrope = Manrope({ subsets: ['latin'] });

// Main layout component
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser(); // Fetch user information

  return (
    <html
      lang="en"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50 flex flex-col">
        <UserProvider userPromise={userPromise}>
          { <Navbar /> }
          {/* Render the children passed to this layout */}
          <main className="flex-1">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}