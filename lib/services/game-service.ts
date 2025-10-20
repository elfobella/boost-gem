import { createClient } from '@/lib/supabase/client'
import { Game, GameRank, GameFilter, PaginatedResponse } from '@/lib/types/game-boosting'

const supabase = createClient()

export class GameService {
  // Get all games with optional filters
  static async getGames(filter?: GameFilter): Promise<Game[]> {
    let query = supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (filter?.platforms && filter.platforms.length > 0) {
      query = query.overlaps('platforms', filter.platforms)
    }

    if (filter?.search) {
      query = query.ilike('name', `%${filter.search}%`)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch games: ${error.message}`)
    }

    return data || []
  }

  // Get game by slug
  static async getGameBySlug(slug: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch game: ${error.message}`)
    }

    return data
  }

  // Get game by ID
  static async getGameById(id: string): Promise<Game | null> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch game: ${error.message}`)
    }

    return data
  }

  // Get ranks for a specific game
  static async getGameRanks(gameId: string): Promise<GameRank[]> {
    const { data, error } = await supabase
      .from('game_ranks')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('min_mmr', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch game ranks: ${error.message}`)
    }

    return data || []
  }

  // Get rank by ID
  static async getRankById(id: string): Promise<GameRank | null> {
    const { data, error } = await supabase
      .from('game_ranks')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch rank: ${error.message}`)
    }

    return data
  }

  // Get popular games (by order count)
  static async getPopularGames(limit: number = 6): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        orders!inner(count)
      `)
      .eq('is_active', true)
      .order('orders.count', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch popular games: ${error.message}`)
    }

    return data || []
  }

  // Search games
  static async searchGames(query: string, limit: number = 10): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${query}%`)
      .limit(limit)

    if (error) {
      throw new Error(`Failed to search games: ${error.message}`)
    }

    return data || []
  }

  // Get games with pagination
  static async getGamesPaginated(
    page: number = 1,
    limit: number = 12,
    filter?: GameFilter
  ): Promise<PaginatedResponse<Game>> {
    const offset = (page - 1) * limit

    let query = supabase
      .from('games')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limit - 1)

    if (filter?.platforms && filter.platforms.length > 0) {
      query = query.overlaps('platforms', filter.platforms)
    }

    if (filter?.search) {
      query = query.ilike('name', `%${filter.search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch games: ${error.message}`)
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

  // Get game with ranks
  static async getGameWithRanks(slug: string): Promise<Game & { ranks: GameRank[] } | null> {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        game_ranks(*)
      `)
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch game with ranks: ${error.message}`)
    }

    return {
      ...data,
      ranks: data.game_ranks || []
    }
  }

  // Get rank hierarchy for a game
  static async getRankHierarchy(gameId: string): Promise<GameRank[]> {
    const { data, error } = await supabase
      .from('game_ranks')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('min_mmr', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch rank hierarchy: ${error.message}`)
    }

    return data || []
  }

  // Calculate rank difference for pricing
  static async calculateRankDifference(
    gameId: string,
    fromRankId: string,
    toRankId: string
  ): Promise<{ fromRank: GameRank; toRank: GameRank; tierDifference: number }> {
    const [fromRank, toRank] = await Promise.all([
      this.getRankById(fromRankId),
      this.getRankById(toRankId)
    ])

    if (!fromRank || !toRank) {
      throw new Error('One or both ranks not found')
    }

    if (fromRank.game_id !== gameId || toRank.game_id !== gameId) {
      throw new Error('Ranks do not belong to the specified game')
    }

    const tierDifference = toRank.tier - fromRank.tier

    return {
      fromRank,
      toRank,
      tierDifference
    }
  }

  // Get available platforms
  static async getAvailablePlatforms(): Promise<string[]> {
    const { data, error } = await supabase
      .from('games')
      .select('platforms')
      .eq('is_active', true)

    if (error) {
      throw new Error(`Failed to fetch platforms: ${error.message}`)
    }

    const platforms = new Set<string>()
    data?.forEach(game => {
      game.platforms?.forEach(platform => platforms.add(platform))
    })

    return Array.from(platforms).sort()
  }

  // Get games by platform
  static async getGamesByPlatform(platform: string): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .contains('platforms', [platform])
      .order('name')

    if (error) {
      throw new Error(`Failed to fetch games by platform: ${error.message}`)
    }

    return data || []
  }
}
