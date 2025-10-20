import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
          Boost Gem
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            Kayıt olun
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
