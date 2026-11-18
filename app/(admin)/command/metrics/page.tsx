import { redirect } from 'next/navigation';

// Redirect to /command.
// Crawler trigger uses variant="outline", ConfirmationDialog, and sets Needs review (Not public).
export default function CommandMetricsRedirect() {
  redirect('/command');
}
