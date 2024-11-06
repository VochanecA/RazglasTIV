// app/(protected)/info/page.tsx
"use client"; // Required for useRouter and useUser hooks

import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';

export default function InfoPage() {
  const { user } = useUser(); // Access user from context
  const router = useRouter();

  // Redirect to sign-in if not logged in
  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/sign-up');
    }
    return null; // Prevent rendering until redirected
  }

  return (
    <div>
      <h1>Protected Info</h1>
      <p>Welcome, {user.name}!</p>
    </div>
  );
}
