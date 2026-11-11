import { redirect } from 'next/navigation';

export default function CommandRootPage() {
  redirect('/command/metrics');
}
