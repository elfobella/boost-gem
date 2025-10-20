// Game Boosting Platform Type Definitions

export interface Game {
  id: string
  name: string
  slug: string
  description?: string
  icon_url?: string
  banner_url?: string
  platforms: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GameRank {
  id: string
  game_id: string
  name: string
  tier: number
  division?: string
  division_name?: string
  min_mmr?: number
  max_mmr?: number
  icon_url?: string
  color_hex?: string
  is_active: boolean
  created_at: string
}

export interface UserProfile {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  country?: string
  timezone: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  is_verified: boolean
  role: 'player' | 'booster' | 'admin'
  total_orders: number
  total_spent: number
  rating: number
  created_at: string
  updated_at: string
}

export interface PlayerGameProfile {
  id: string
  user_id: string
  game_id: string
  current_rank_id?: string
  peak_rank_id?: string
  server_region: string
  username?: string
  level?: number
  experience_points?: number
  is_verified: boolean
  created_at: string
  updated_at: string
  // Relations
  game?: Game
  current_rank?: GameRank
  peak_rank?: GameRank
}

export interface Booster {
  id: string
  user_id: string
  game_id: string
  current_rank_id?: string
  peak_rank_id?: string
  server_regions: string[]
  hourly_rate: number
  total_orders: number
  completed_orders: number
  rating: number
  is_verified: boolean
  is_available: boolean
  bio?: string
  experience_years: number
  languages: string[]
  created_at: string
  updated_at: string
  // Relations
  user?: UserProfile
  game?: Game
  current_rank?: GameRank
  peak_rank?: GameRank
}

export interface ServiceType {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  booster_id?: string
  game_id: string
  service_type_id: string
  current_rank_id?: string
  target_rank_id?: string
  server_region: string
  additional_info?: string
  base_price: number
  platform_fee: number
  total_price: number
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimated_days?: number
  actual_days?: number
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  // Relations
  user?: UserProfile
  booster?: Booster
  game?: Game
  service_type?: ServiceType
  current_rank?: GameRank
  target_rank?: GameRank
  progress?: OrderProgress[]
  payments?: Payment[]
  reviews?: Review[]
  chat_messages?: ChatMessage[]
}

export interface OrderProgress {
  id: string
  order_id: string
  status: string
  message?: string
  screenshot_url?: string
  progress_percentage: number
  created_by?: string
  created_at: string
  // Relations
  order?: Order
  creator?: UserProfile
}

export interface Payment {
  id: string
  order_id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  stripe_payment_intent_id?: string
  transaction_id?: string
  refund_amount: number
  created_at: string
  updated_at: string
  // Relations
  order?: Order
  user?: UserProfile
}

export interface Review {
  id: string
  order_id: string
  user_id: string
  booster_id: string
  rating: number
  comment?: string
  is_public: boolean
  created_at: string
  // Relations
  order?: Order
  user?: UserProfile
  booster?: Booster
}

export interface ChatMessage {
  id: string
  order_id: string
  sender_id: string
  message: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  is_read: boolean
  created_at: string
  // Relations
  order?: Order
  sender?: UserProfile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  is_read: boolean
  action_url?: string
  created_at: string
  // Relations
  user?: UserProfile
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// Form Types
export interface CreateOrderForm {
  game_id: string
  service_type_id: string
  current_rank_id?: string
  target_rank_id?: string
  server_region: string
  additional_info?: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

export interface CreateBoosterProfileForm {
  game_id: string
  current_rank_id?: string
  peak_rank_id?: string
  server_regions: string[]
  hourly_rate: number
  bio?: string
  experience_years: number
  languages: string[]
}

export interface UpdateUserProfileForm {
  username?: string
  full_name?: string
  avatar_url?: string
  country?: string
  timezone?: string
  phone?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
}

// Dashboard Types
export interface DashboardStats {
  total_orders: number
  completed_orders: number
  pending_orders: number
  total_earnings: number
  average_rating: number
  active_orders: number
}

export interface BoosterDashboardStats {
  total_orders: number
  completed_orders: number
  pending_orders: number
  total_earnings: number
  average_rating: number
  active_orders: number
  completion_rate: number
  response_time: number
}

// Filter Types
export interface GameFilter {
  platforms?: string[]
  is_active?: boolean
  search?: string
}

export interface OrderFilter {
  status?: string[]
  game_id?: string
  date_from?: string
  date_to?: string
  priority?: string[]
}

export interface BoosterFilter {
  game_id?: string
  server_regions?: string[]
  min_rating?: number
  is_available?: boolean
  languages?: string[]
}

// Price Calculation Types
export interface PriceCalculation {
  base_price: number
  platform_fee: number
  total_price: number
  breakdown: {
    service_cost: number
    platform_fee_percentage: number
    priority_fee?: number
    region_fee?: number
  }
}

// Order Status Types
export type OrderStatus = 
  | 'pending'
  | 'accepted' 
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type OrderPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

// User Role Types
export type UserRole = 
  | 'player'
  | 'booster'
  | 'admin'

// Server Region Types
export type ServerRegion = 
  | 'EU'
  | 'NA'
  | 'AS'
  | 'TR'
  | 'OCE'
  | 'BR'

// Platform Types
export type Platform = 
  | 'PC'
  | 'Mobile'
  | 'Console'
  | 'PlayStation'
  | 'Xbox'
  | 'Nintendo Switch'
