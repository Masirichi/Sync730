import { redirect } from 'next/navigation';

export default function RegisterRecruiterRedirect() {
  redirect('/signup/company');
}
