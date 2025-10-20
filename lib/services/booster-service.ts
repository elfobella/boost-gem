import { createClient } from '@/lib/supabase/client'
import { 
  Booster, 
  CreateBoosterProfileForm, 
  BoosterFilter, 
  PaginatedResponse,
  BoosterDashboardStats 
} from '@/lib/types/game-boosting'

const supabase = createClient()

export class BoosterService {
  // Create booster profile
  static async createBoosterProfile(form: CreateBoosterProfileForm): Promise<Booster> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to create booster profile')
    }

    // Check if user already has a booster profile for this game
    const { data: existingBooster, error: checkError } = await supabase
      .from('boosters')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', form.game_id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing booster profile: ${checkError.message}`)
    }

    if (existingBooster) {
      throw new Error('Booster profile already exists for this game')
    }

    const { data, error } = await supabase
      .from('boosters')
      .insert({
        user_id: user.id,
        game_id: form.game_id,
        current_rank_id: form.current_rank_id,
        peak_rank_id: form.peak_rank_id,
        server_regions: form.server_regions,
        hourly_rate: form.hourly_rate,
        bio: form.bio,
        experience_years: form.experience_years,
        languages: form.languages
      })
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create booster profile: ${error.message}`)
    }

    return data
  }

  // Get booster profile by user and game
  static async getBoosterProfile(userId: string, gameId: string): Promise<Booster | null> {
    const { data, error } = await supabase
      .from('boosters')
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch booster profile: ${error.message}`)
    }

    return data
  }

  // Get current user's booster profiles
  static async getMyBoosterProfiles(): Promise<Booster[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await supabase
      .from('boosters')
      .select(`
        *,
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch booster profiles: ${error.message}`)
    }

    return data || []
  }

  // Update booster profile
  static async updateBoosterProfile(
    boosterId: string, 
    updates: Partial<CreateBoosterProfileForm>
  ): Promise<Booster> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await supabase
      .from('boosters')
      .update(updates)
      .eq('id', boosterId)
      .eq('user_id', user.id)
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update booster profile: ${error.message}`)
    }

    return data
  }

  // Get available boosters with filters
  static async getAvailableBoosters(filter?: BoosterFilter): Promise<Booster[]> {
    let query = supabase
      .from('boosters')
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .eq('is_available', true)
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .order('total_orders', { ascending: false })

    if (filter?.game_id) {
      query = query.eq('game_id', filter.game_id)
    }

    if (filter?.server_regions && filter.server_regions.length > 0) {
      query = query.overlaps('server_regions', filter.server_regions)
    }

    if (filter?.min_rating) {
      query = query.gte('rating', filter.min_rating)
    }

    if (filter?.languages && filter.languages.length > 0) {
      query = query.overlaps('languages', filter.languages)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch available boosters: ${error.message}`)
    }

    return data || []
  }

  // Get boosters with pagination
  static async getBoostersPaginated(
    page: number = 1,
    limit: number = 12,
    filter?: BoosterFilter
  ): Promise<PaginatedResponse<Booster>> {
    const offset = (page - 1) * limit

    let query = supabase
      .from('boosters')
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `, { count: 'exact' })
      .eq('is_verified', true)
      .order('rating', { ascending: false })
      .order('total_orders', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter?.game_id) {
      query = query.eq('game_id', filter.game_id)
    }

    if (filter?.server_regions && filter.server_regions.length > 0) {
      query = query.overlaps('server_regions', filter.server_regions)
    }

    if (filter?.min_rating) {
      query = query.gte('rating', filter.min_rating)
    }

    if (filter?.is_available !== undefined) {
      query = query.eq('is_available', filter.is_available)
    }

    if (filter?.languages && filter.languages.length > 0) {
      query = query.overlaps('languages', filter.languages)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch boosters: ${error.message}`)
    }

    const total = count || 0
    const total_pages = Math.ceil(total / limit)

    return {
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        total_pages
      }
    }
  }

  // Get booster by ID
  static async getBoosterById(id: string): Promise<Booster | null> {
    const { data, error } = await supabase
      .from('boosters')
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch booster: ${error.message}`)
    }

    return data
  }

  // Update booster availability
  static async updateAvailability(boosterId: string, isAvailable: boolean): Promise<Booster> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await supabase
      .from('boosters')
      .update({ is_available: isAvailable })
      .eq('id', boosterId)
      .eq('user_id', user.id)
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update booster availability: ${error.message}`)
    }

    return data
  }

  // Get booster dashboard stats
  static async getBoosterDashboardStats(): Promise<BoosterDashboardStats> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    // Get booster IDs for this user
    const { data: boosters, error: boosterError } = await supabase
      .from('boosters')
      .select('id')
      .eq('user_id', user.id)

    if (boosterError) {
      throw new Error(`Failed to fetch booster profiles: ${boosterError.message}`)
    }

    if (!boosters || boosters.length === 0) {
      return {
        total_orders: 0,
        completed_orders: 0,
        pending_orders: 0,
        total_earnings: 0,
        average_rating: 0,
        active_orders: 0,
        completion_rate: 0,
        response_time: 0
      }
    }

    const boosterIds = boosters.map(b => b.id)

    // Get order statistics
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status, total_price, created_at, accepted_at')
      .in('booster_id', boosterIds)

    if (ordersError) {
      throw new Error(`Failed to fetch order statistics: ${ordersError.message}`)
    }

    const totalOrders = orders.length
    const completedOrders = orders.filter(o => o.status === 'completed').length
    const pendingOrders = orders.filter(o => o.status === 'pending').length
    const activeOrders = orders.filter(o => ['accepted', 'in_progress'].includes(o.status)).length
    const totalEarnings = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total_price, 0)

    // Get average rating
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating')
      .in('booster_id', boosterIds)

    if (reviewsError) {
      throw new Error(`Failed to fetch reviews: ${reviewsError.message}`)
    }

    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0

    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

    return {
      total_orders: totalOrders,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      total_earnings: totalEarnings,
      average_rating: Math.round(averageRating * 100) / 100,
      active_orders: activeOrders,
      completion_rate: Math.round(completionRate * 100) / 100,
      response_time: 0 // This would be calculated based on actual response times
    }
  }

  // Get top boosters for a game
  static async getTopBoosters(gameId: string, limit: number = 10): Promise<Booster[]> {
    const { data, error } = await supabase
      .from('boosters')
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .eq('game_id', gameId)
      .eq('is_verified', true)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .order('total_orders', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch top boosters: ${error.message}`)
    }

    return data || []
  }

  // Search boosters
  static async searchBoosters(
    query: string, 
    gameId?: string, 
    limit: number = 10
  ): Promise<Booster[]> {
    let supabaseQuery = supabase
      .from('boosters')
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .eq('is_verified', true)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(limit)

    if (gameId) {
      supabaseQuery = supabaseQuery.eq('game_id', gameId)
    }

    // Search in user profiles
    const { data, error } = await supabaseQuery
      .ilike('user.username', `%${query}%`)

    if (error) {
      throw new Error(`Failed to search boosters: ${error.message}`)
    }

    return data || []
  }

  // Delete booster profile
  static async deleteBoosterProfile(boosterId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { error } = await supabase
      .from('boosters')
      .delete()
      .eq('id', boosterId)
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`Failed to delete booster profile: ${error.message}`)
    }
  }

  // Verify booster (admin only)
  static async verifyBooster(boosterId: string, isVerified: boolean): Promise<Booster> {
    const { data, error } = await supabase
      .from('boosters')
      .update({ is_verified: isVerified })
      .eq('id', boosterId)
      .select(`
        *,
        user:user_profiles(*),
        game:games(*),
        current_rank:game_ranks(*),
        peak_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to verify booster: ${error.message}`)
    }

    return data
  }
}
