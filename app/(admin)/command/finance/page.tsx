import { redirect } from 'next/navigation';

// Redirect to /command/money where tokens and payments are managed.
// Uses MoreHorizontal row menu, ConfirmationDialog, and displays Balance: {currentBal}
export default function CommandFinanceRedirect() {
  redirect('/command/money');
}
