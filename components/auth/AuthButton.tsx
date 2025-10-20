'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import ThemeToggle from '@/components/ThemeToggle'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span className="text-gray-600 dark:text-gray-400">Yükleniyor...</span>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Hoş geldin, {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Çıkış Yap
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <ThemeToggle />
      <div className="flex space-x-2">
        <button
          onClick={() => router.push('/login')}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Giriş Yap
        </button>
        <button
          onClick={() => router.push('/register')}
          className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
        >
          Kayıt Ol
        </button>
      </div>
    </div>
  )
}
