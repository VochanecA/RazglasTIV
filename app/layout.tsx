// app/layout.tsx

import './globals.css'; // Import global CSS styles
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google'; // Import the Manrope font
import { UserProvider } from '@/lib/auth'; // Import UserProvider for authentication context
import { getUser } from '@/lib/db/queries'; // Import user fetching function
import Navbar from '@/components/Navbar'; // Import the Navbar component

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
      <body className="min-h-[100dvh] bg-gray-50">
        <UserProvider userPromise={userPromise}>
          {/* Include the Navbar at the top */}
          <Navbar />
          
          {/* Main content area */}
          <main>
            {children}
          </main>
        </UserProvider>
      </body>
    </html>
  );
}
