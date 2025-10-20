import { createClient } from '@/lib/supabase/client'
import { 
  Order, 
  CreateOrderForm, 
  OrderFilter, 
  PaginatedResponse, 
  OrderStatus,
  PriceCalculation 
} from '@/lib/types/game-boosting'

const supabase = createClient()

export class OrderService {
  // Create a new order
  static async createOrder(form: CreateOrderForm): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated to create an order')
    }

    // Calculate pricing
    const pricing = await this.calculateOrderPrice(form)
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        game_id: form.game_id,
        service_type_id: form.service_type_id,
        current_rank_id: form.current_rank_id,
        target_rank_id: form.target_rank_id,
        server_region: form.server_region,
        additional_info: form.additional_info,
        base_price: pricing.base_price,
        platform_fee: pricing.platform_fee,
        total_price: pricing.total_price,
        priority: form.priority
      })
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create order: ${error.message}`)
    }

    return data
  }

  // Get orders for current user
  static async getUserOrders(filter?: OrderFilter): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    let query = supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*),
        booster:boosters(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (filter?.status && filter.status.length > 0) {
      query = query.in('status', filter.status)
    }

    if (filter?.game_id) {
      query = query.eq('game_id', filter.game_id)
    }

    if (filter?.date_from) {
      query = query.gte('created_at', filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte('created_at', filter.date_to)
    }

    if (filter?.priority && filter.priority.length > 0) {
      query = query.in('priority', filter.priority)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`)
    }

    return data || []
  }

  // Get orders for booster
  static async getBoosterOrders(filter?: OrderFilter): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    // First get booster IDs for this user
    const { data: boosters, error: boosterError } = await supabase
      .from('boosters')
      .select('id')
      .eq('user_id', user.id)

    if (boosterError) {
      throw new Error(`Failed to fetch booster profile: ${boosterError.message}`)
    }

    if (!boosters || boosters.length === 0) {
      return []
    }

    const boosterIds = boosters.map(b => b.id)

    let query = supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*),
        user:user_profiles(*)
      `)
      .in('booster_id', boosterIds)
      .order('created_at', { ascending: false })

    if (filter?.status && filter.status.length > 0) {
      query = query.in('status', filter.status)
    }

    if (filter?.game_id) {
      query = query.eq('game_id', filter.game_id)
    }

    if (filter?.date_from) {
      query = query.gte('created_at', filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte('created_at', filter.date_to)
    }

    if (filter?.priority && filter.priority.length > 0) {
      query = query.in('priority', filter.priority)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch booster orders: ${error.message}`)
    }

    return data || []
  }

  // Get order by ID
  static async getOrderById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*),
        user:user_profiles(*),
        booster:boosters(*),
        progress:order_progress(*),
        payments:payments(*),
        reviews:reviews(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch order: ${error.message}`)
    }

    return data
  }

  // Update order status
  static async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    message?: string
  ): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const updateData: any = { status }

    if (status === 'in_progress') {
      updateData.started_at = new Date().toISOString()
    }

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to update order status: ${error.message}`)
    }

    // Add progress entry if message provided
    if (message) {
      await supabase
        .from('order_progress')
        .insert({
          order_id: orderId,
          status,
          message,
          created_by: user.id
        })
    }

    return data
  }

  // Accept order (for boosters)
  static async acceptOrder(orderId: string): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    // Get booster for this user
    const { data: booster, error: boosterError } = await supabase
      .from('boosters')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (boosterError || !booster) {
      throw new Error('User is not a verified booster')
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        booster_id: booster.id,
        status: 'accepted'
      })
      .eq('id', orderId)
      .eq('status', 'pending')
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to accept order: ${error.message}`)
    }

    return data
  }

  // Cancel order
  static async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User must be authenticated')
    }

    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled'
      })
      .eq('id', orderId)
      .eq('user_id', user.id)
      .in('status', ['pending', 'accepted'])
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to cancel order: ${error.message}`)
    }

    // Add progress entry
    if (reason) {
      await supabase
        .from('order_progress')
        .insert({
          order_id: orderId,
          status: 'cancelled',
          message: reason,
          created_by: user.id
        })
    }

    return data
  }

  // Calculate order price
  static async calculateOrderPrice(form: CreateOrderForm): Promise<PriceCalculation> {
    // Base pricing logic (this would be more complex in reality)
    let basePrice = 0
    let platformFeePercentage = 0.15 // 15% platform fee

    // Calculate based on rank difference if both ranks provided
    if (form.current_rank_id && form.target_rank_id) {
      // This would involve complex pricing logic based on rank difference
      // For now, using a simple calculation
      basePrice = 50 // Base price
      platformFeePercentage = 0.15
    } else {
      // Service-based pricing
      basePrice = 25 // Base service price
      platformFeePercentage = 0.15
    }

    // Priority multiplier
    const priorityMultiplier = {
      'low': 1.0,
      'normal': 1.0,
      'high': 1.2,
      'urgent': 1.5
    }[form.priority] || 1.0

    basePrice *= priorityMultiplier

    const platformFee = basePrice * platformFeePercentage
    const totalPrice = basePrice + platformFee

    return {
      base_price: basePrice,
      platform_fee: platformFee,
      total_price: totalPrice,
      breakdown: {
        service_cost: basePrice,
        platform_fee_percentage: platformFeePercentage,
        priority_fee: priorityMultiplier > 1 ? (basePrice * (priorityMultiplier - 1)) : 0
      }
    }
  }

  // Get orders with pagination
  static async getOrdersPaginated(
    page: number = 1,
    limit: number = 10,
    filter?: OrderFilter
  ): Promise<PaginatedResponse<Order>> {
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        service_type:service_types(*),
        current_rank:game_ranks(*),
        target_rank:game_ranks(*),
        user:user_profiles(*),
        booster:boosters(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filter?.status && filter.status.length > 0) {
      query = query.in('status', filter.status)
    }

    if (filter?.game_id) {
      query = query.eq('game_id', filter.game_id)
    }

    if (filter?.date_from) {
      query = query.gte('created_at', filter.date_from)
    }

    if (filter?.date_to) {
      query = query.lte('created_at', filter.date_to)
    }

    if (filter?.priority && filter.priority.length > 0) {
      query = query.in('priority', filter.priority)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`)
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

  // Get order statistics
  static async getOrderStats(): Promise<{
    total_orders: number
    completed_orders: number
    pending_orders: number
    in_progress_orders: number
    cancelled_orders: number
    total_revenue: number
  }> {
    const { data, error } = await supabase
      .from('orders')
      .select('status, total_price')

    if (error) {
      throw new Error(`Failed to fetch order stats: ${error.message}`)
    }

    const stats = {
      total_orders: data.length,
      completed_orders: data.filter(o => o.status === 'completed').length,
      pending_orders: data.filter(o => o.status === 'pending').length,
      in_progress_orders: data.filter(o => o.status === 'in_progress').length,
      cancelled_orders: data.filter(o => o.status === 'cancelled').length,
      total_revenue: data
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total_price, 0)
    }

    return stats
  }
}
