// app/about/layout.tsx

import '../globals.css'; // Adjusted import path based on your structure
import type { Metadata } from 'next';
import { UserProvider } from '@/lib/auth'; // Import UserProvider for authentication context
import MyNavbar from '@/components/ui/navbar'; // Ensure the path is correct

export const metadata: Metadata = {
  title: 'About Us - Next.js SaaS Starter',
  description: 'Learn more about our service and what we offer.',
};

export default async function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-white dark:bg-gray-950 text-black dark:text-white">
      <body className="min-h-[100dvh] bg-gray-50">
 
          <MyNavbar /> {/* Make sure this component is error-free */}
          {children}
       
      </body>
    </html>
  );
}
