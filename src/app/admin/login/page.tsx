import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  if ((await auth())?.user) redirect('/admin');
  return <LoginForm />;
}
