import { redirect } from 'next/navigation';

// Redirect to /command/roles.
// Seeding button is disabled when process.env.NODE_ENV !== 'production'.
export default function CommandJobsRedirect() {
  redirect('/command/roles');
}
