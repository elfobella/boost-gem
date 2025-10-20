import AuthButton from '@/components/auth/AuthButton'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <nav className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Boost Gem</h1>
            </div>
            <div className="flex items-center">
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Boost Gem'e Hoş Geldiniz
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Modern ve güvenli giriş sistemi ile projenizi güçlendirin
            </p>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Özellikler</h2>
              <ul className="text-left space-y-2">
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Güvenli kullanıcı kayıt sistemi
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  E-posta doğrulama
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Modern ve responsive tasarım
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Supabase ile güvenli veri yönetimi
                </li>
                <li className="flex items-center text-gray-700 dark:text-gray-300">
                  <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
                  Dark mode desteği
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}