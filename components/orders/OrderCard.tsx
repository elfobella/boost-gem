'use client'

import { Order } from '@/lib/types/game-boosting'
import { motion } from 'framer-motion'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  PlayCircle,
  DollarSign,
  User,
  Calendar
} from 'lucide-react'
import Link from 'next/link'

interface OrderCardProps {
  order: Order
  showActions?: boolean
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    label: 'Pending'
  },
  accepted: {
    icon: CheckCircle,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    label: 'Accepted'
  },
  in_progress: {
    icon: PlayCircle,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    label: 'In Progress'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    label: 'Completed'
  },
  cancelled: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    label: 'Cancelled'
  },
  disputed: {
    icon: AlertCircle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    label: 'Disputed'
  }
}

const priorityConfig = {
  low: {
    color: 'text-gray-600 dark:text-gray-400',
    label: 'Low'
  },
  normal: {
    color: 'text-blue-600 dark:text-blue-400',
    label: 'Normal'
  },
  high: {
    color: 'text-orange-600 dark:text-orange-400',
    label: 'High'
  },
  urgent: {
    color: 'text-red-600 dark:text-red-400',
    label: 'Urgent'
  }
}

export default function OrderCard({ order, showActions = true }: OrderCardProps) {
  const status = statusConfig[order.status] || statusConfig.pending
  const priority = priorityConfig[order.priority] || priorityConfig.normal
  const StatusIcon = status.icon

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${status.bgColor}`}>
              <StatusIcon className={`w-5 h-5 ${status.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {order.game?.name} Boost
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {order.service_type?.name}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`text-sm font-medium ${priority.color}`}>
                {priority.label}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatPrice(order.total_price)}
            </p>
          </div>
        </div>

        {/* Game Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Current Rank:
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {order.current_rank?.name || 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Target Rank:
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {order.target_rank?.name || 'N/A'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Server:
              </span>
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {order.server_region}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Priority:
              </span>
              <span className={`text-sm font-medium ${priority.color}`}>
                {priority.label}
              </span>
            </div>
          </div>
        </div>

        {/* Booster Info */}
        {order.booster && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Assigned Booster
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {order.booster.user?.username || 'Anonymous'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        {order.status === 'in_progress' && order.progress && order.progress.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {order.progress[order.progress.length - 1]?.progress_percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${order.progress[order.progress.length - 1]?.progress_percentage || 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Additional Info */}
        {order.additional_info && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Note:</span> {order.additional_info}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(order.created_at)}</span>
            </div>
            
            {order.estimated_days && (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{order.estimated_days} days</span>
              </div>
            )}
          </div>

          {showActions && (
            <div className="flex items-center space-x-2">
              <Link
                href={`/orders/${order.id}`}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
              >
                View Details
              </Link>
              
              {order.status === 'pending' && (
                <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200">
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
