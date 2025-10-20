import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuthButton from '@/components/auth/AuthButton'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Boost Gem Dashboard</h1>
            </div>
            <div className="flex items-center">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Hoş geldin, {user.email}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Dashboard'a başarıyla giriş yaptınız.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
