'use client'

import { Game } from '@/lib/types/game-boosting'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Gamepad2, Users, Star } from 'lucide-react'

interface GameCardProps {
  game: Game
  showStats?: boolean
}

export default function GameCard({ game, showStats = false }: GameCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <Link href={`/games/${game.slug}`}>
        <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
          {game.banner_url ? (
            <img
              src={game.banner_url}
              alt={game.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Gamepad2 className="w-16 h-16 text-white opacity-80" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-opacity duration-300" />
          
          {/* Game icon */}
          {game.icon_url && (
            <div className="absolute top-4 left-4">
              <img
                src={game.icon_url}
                alt={game.name}
                className="w-12 h-12 rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
              {game.name}
            </h3>
            {showStats && (
              <div className="flex items-center space-x-1 text-yellow-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">4.8</span>
              </div>
            )}
          </div>

          {game.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {game.description}
            </p>
          )}

          {/* Platforms */}
          <div className="flex flex-wrap gap-2 mb-4">
            {game.platforms.map((platform) => (
              <span
                key={platform}
                className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md"
              >
                {platform}
              </span>
            ))}
          </div>

          {/* Stats */}
          {showStats && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>1.2k boosters</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>4.8 rating</span>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-4">
            <span className="inline-flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
              View Details
              <svg
                className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
