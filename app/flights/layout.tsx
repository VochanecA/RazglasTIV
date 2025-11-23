import '../globals.css';
import type { Metadata } from 'next';
import { UserProvider } from '@/lib/auth';
import MyNavbar from '@/components/ui/navbar';

export const metadata: Metadata = {
  title: 'Flights - Next.js SaaS Starter',
  description: 'Book your flights with our service.',
};

export default async function FlightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Your flights-specific layout content goes here */}
      {children}
    </>
  );
}