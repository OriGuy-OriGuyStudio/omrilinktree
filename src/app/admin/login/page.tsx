import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 m-0 bg-neutral-950">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}
