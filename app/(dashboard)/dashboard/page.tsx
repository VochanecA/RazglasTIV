import { redirect } from 'next/navigation';
import { Settings } from './settings';
import { getTeamForUser, getUser } from '@/lib/db/queries';

export default async function SettingsPage() {
  try {
    const user = await getUser();
    if (!user) {
      console.error('No user found. Redirecting to sign-in.');
      redirect('/sign-in');
      return null;
    }

    const teamData = await getTeamForUser(user.id);
    if (!teamData) {
      throw new Error('Team not found for user.');
    }

    return <Settings teamData={teamData} />;
  } catch (error) {
    console.error('Error in SettingsPage:', error);
    redirect('/error'); // Optional: Redirect to a generic error page
    return null;
  }
}