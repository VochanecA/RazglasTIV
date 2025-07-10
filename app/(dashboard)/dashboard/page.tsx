import { redirect } from 'next/navigation';
import { Settings } from './settings';
import { getTeamForUser, getUser } from '@/lib/db/queries';

export default async function SettingsPage() {
  const user = await getUser();

  // Redirect to sign-in if no user is found
  if (!user) {
   // console.error('No user found. Redirecting to sign-in.');
    redirect('/'); // This will stop further execution -rijesen problem sa log out-om
  }

  const teamData = await getTeamForUser(user.id);

  // Handle case where team data is not found
  if (!teamData) {
 //   console.error('Team not found for user.');
    redirect('/error'); // Redirect to an error page
  }

  // Render the Settings component with team data
  return <Settings teamData={teamData} />;
}
