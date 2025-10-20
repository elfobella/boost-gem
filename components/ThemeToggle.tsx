'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const

  return (
    <div className="relative">
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`
              relative flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${
                theme === value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }
            `}
            title={`Switch to ${label} mode`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            
            {/* Active indicator */}
            {theme === value && (
              <motion.div
                layoutId="activeTheme"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// Compact version for mobile
export function ThemeToggleCompact() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getIcon = () => {
    switch (resolvedTheme) {
      case 'dark':
        return Moon
      case 'light':
        return Sun
      default:
        return Monitor
    }
  }

  const Icon = getIcon()

  return (
    <motion.button
      onClick={cycleTheme}
      className="
        p-2 rounded-lg bg-gray-100 dark:bg-gray-800 
        text-gray-600 dark:text-gray-400 
        hover:text-gray-900 dark:hover:text-gray-100
        hover:bg-gray-200 dark:hover:bg-gray-700
        transition-all duration-200
      "
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Current: ${theme} mode (click to cycle)`}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  )
}
