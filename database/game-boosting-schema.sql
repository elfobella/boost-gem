-- =============================================
-- GAME BOOSTING PLATFORM DATABASE SCHEMA
-- =============================================

-- 1. Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  banner_url TEXT,
  platforms TEXT[] DEFAULT '{}', -- ['PC', 'Mobile', 'Console']
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Game ranks table
CREATE TABLE IF NOT EXISTS game_ranks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tier INTEGER NOT NULL, -- 1-10 (Bronze=1, Silver=2, Gold=3, etc.)
  division TEXT, -- I, II, III, IV, V
  division_name TEXT, -- 'Bronze I', 'Silver II', etc.
  min_mmr INTEGER,
  max_mmr INTEGER,
  icon_url TEXT,
  color_hex TEXT, -- #FFD700 for Gold
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'Europe/Istanbul',
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  is_verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'booster', 'admin')),
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0, -- 0.00 to 5.00
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Player game profiles
CREATE TABLE IF NOT EXISTS player_game_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  current_rank_id UUID REFERENCES game_ranks(id),
  peak_rank_id UUID REFERENCES game_ranks(id),
  server_region TEXT DEFAULT 'EU', -- EU, NA, AS, TR
  username TEXT, -- In-game username
  level INTEGER,
  experience_points INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 5. Boosters table
CREATE TABLE IF NOT EXISTS boosters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  current_rank_id UUID REFERENCES game_ranks(id),
  peak_rank_id UUID REFERENCES game_ranks(id),
  server_regions TEXT[] DEFAULT '{}', -- ['EU', 'NA', 'AS']
  hourly_rate DECIMAL(8,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  bio TEXT,
  experience_years INTEGER DEFAULT 0,
  languages TEXT[] DEFAULT '{}', -- ['English', 'Turkish']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, game_id)
);

-- 6. Service types
CREATE TABLE IF NOT EXISTS service_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_id UUID REFERENCES boosters(id),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  service_type_id UUID REFERENCES service_types(id),
  current_rank_id UUID REFERENCES game_ranks(id),
  target_rank_id UUID REFERENCES game_ranks(id),
  server_region TEXT DEFAULT 'EU',
  additional_info TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_days INTEGER,
  actual_days INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Order progress tracking
CREATE TABLE IF NOT EXISTS order_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  message TEXT,
  screenshot_url TEXT,
  progress_percentage INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT, -- 'stripe', 'paypal', 'crypto'
  stripe_payment_intent_id TEXT,
  transaction_id TEXT,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  booster_id UUID REFERENCES boosters(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  file_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_game_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Games - Public read access
CREATE POLICY "Games are viewable by everyone" ON games
  FOR SELECT USING (true);

-- Game ranks - Public read access
CREATE POLICY "Game ranks are viewable by everyone" ON game_ranks
  FOR SELECT USING (true);

-- User profiles - Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Player game profiles - Users can manage their own
CREATE POLICY "Users can view own game profiles" ON player_game_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own game profiles" ON player_game_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game profiles" ON player_game_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Boosters - Public read, own write
CREATE POLICY "Boosters are viewable by everyone" ON boosters
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own booster profile" ON boosters
  FOR ALL USING (auth.uid() = user_id);

-- Service types - Public read access
CREATE POLICY "Service types are viewable by everyone" ON service_types
  FOR SELECT USING (true);

-- Orders - Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM boosters WHERE id = orders.booster_id));

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Boosters can update assigned orders" ON orders
  FOR UPDATE USING (auth.uid() = (SELECT user_id FROM boosters WHERE id = orders.booster_id));

-- Order progress - Related to orders
CREATE POLICY "Users can view order progress" ON order_progress
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM orders WHERE id = order_progress.order_id) OR
    auth.uid() = (SELECT user_id FROM boosters WHERE id = (SELECT booster_id FROM orders WHERE id = order_progress.order_id))
  );

CREATE POLICY "Users can create order progress" ON order_progress
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM orders WHERE id = order_progress.order_id) OR
    auth.uid() = (SELECT user_id FROM boosters WHERE id = (SELECT booster_id FROM orders WHERE id = order_progress.order_id))
  );

-- Payments - Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Reviews - Public read, own write
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat messages - Order participants only
CREATE POLICY "Order participants can view messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM orders WHERE id = chat_messages.order_id) OR
    auth.uid() = (SELECT user_id FROM boosters WHERE id = (SELECT booster_id FROM orders WHERE id = chat_messages.order_id))
  );

CREATE POLICY "Order participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM orders WHERE id = chat_messages.order_id) OR
    auth.uid() = (SELECT user_id FROM boosters WHERE id = (SELECT booster_id FROM orders WHERE id = chat_messages.order_id))
  );

-- Notifications - Users can view their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER handle_updated_at_games
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_player_game_profiles
  BEFORE UPDATE ON player_game_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_boosters
  BEFORE UPDATE ON boosters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_orders
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_slug ON games(slug);
CREATE INDEX IF NOT EXISTS idx_games_active ON games(is_active);

-- Game ranks indexes
CREATE INDEX IF NOT EXISTS idx_game_ranks_game_id ON game_ranks(game_id);
CREATE INDEX IF NOT EXISTS idx_game_ranks_tier ON game_ranks(tier);

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Player game profiles indexes
CREATE INDEX IF NOT EXISTS idx_player_game_profiles_user_id ON player_game_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_player_game_profiles_game_id ON player_game_profiles(game_id);

-- Boosters indexes
CREATE INDEX IF NOT EXISTS idx_boosters_user_id ON boosters(user_id);
CREATE INDEX IF NOT EXISTS idx_boosters_game_id ON boosters(game_id);
CREATE INDEX IF NOT EXISTS idx_boosters_available ON boosters(is_available);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_booster_id ON orders(booster_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Order progress indexes
CREATE INDEX IF NOT EXISTS idx_order_progress_order_id ON order_progress(order_id);
CREATE INDEX IF NOT EXISTS idx_order_progress_created_at ON order_progress(created_at);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booster_id ON reviews(booster_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_order_id ON chat_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample games
INSERT INTO games (name, slug, description, platforms) VALUES
('League of Legends', 'league-of-legends', 'Popular MOBA game', ARRAY['PC']),
('Valorant', 'valorant', 'Tactical FPS game', ARRAY['PC']),
('CS:GO', 'csgo', 'Counter-Strike: Global Offensive', ARRAY['PC']),
('Dota 2', 'dota-2', 'Defense of the Ancients 2', ARRAY['PC']),
('Mobile Legends', 'mobile-legends', 'Mobile MOBA game', ARRAY['Mobile']);

-- Insert sample service types
INSERT INTO service_types (name, slug, description) VALUES
('Rank Boost', 'rank-boost', 'Boost your rank to desired tier'),
('Win Boost', 'win-boost', 'Win specific number of games'),
('Placement Matches', 'placement-matches', 'Complete placement matches'),
('Coaching Session', 'coaching-session', '1-on-1 coaching session'),
('Account Recovery', 'account-recovery', 'Recover lost account progress');

-- Insert sample game ranks for League of Legends
INSERT INTO game_ranks (game_id, name, tier, division, division_name, min_mmr, max_mmr, color_hex) 
SELECT 
  g.id,
  rank_data.name,
  rank_data.tier,
  rank_data.division,
  rank_data.division_name,
  rank_data.min_mmr,
  rank_data.max_mmr,
  rank_data.color_hex
FROM games g
CROSS JOIN (
  VALUES 
    ('Iron IV', 1, 'IV', 'Iron IV', 0, 399, '#8B4513'),
    ('Iron III', 1, 'III', 'Iron III', 400, 799, '#8B4513'),
    ('Iron II', 1, 'II', 'Iron II', 800, 1199, '#8B4513'),
    ('Iron I', 1, 'I', 'Iron I', 1200, 1599, '#8B4513'),
    ('Bronze IV', 2, 'IV', 'Bronze IV', 1600, 1999, '#CD7F32'),
    ('Bronze III', 2, 'III', 'Bronze III', 2000, 2399, '#CD7F32'),
    ('Bronze II', 2, 'II', 'Bronze II', 2400, 2799, '#CD7F32'),
    ('Bronze I', 2, 'I', 'Bronze I', 2800, 3199, '#CD7F32'),
    ('Silver IV', 3, 'IV', 'Silver IV', 3200, 3599, '#C0C0C0'),
    ('Silver III', 3, 'III', 'Silver III', 3600, 3999, '#C0C0C0'),
    ('Silver II', 3, 'II', 'Silver II', 4000, 4399, '#C0C0C0'),
    ('Silver I', 3, 'I', 'Silver I', 4400, 4799, '#C0C0C0'),
    ('Gold IV', 4, 'IV', 'Gold IV', 4800, 5199, '#FFD700'),
    ('Gold III', 4, 'III', 'Gold III', 5200, 5599, '#FFD700'),
    ('Gold II', 4, 'II', 'Gold II', 5600, 5999, '#FFD700'),
    ('Gold I', 4, 'I', 'Gold I', 6000, 6399, '#FFD700'),
    ('Platinum IV', 5, 'IV', 'Platinum IV', 6400, 6799, '#00CED1'),
    ('Platinum III', 5, 'III', 'Platinum III', 6800, 7199, '#00CED1'),
    ('Platinum II', 5, 'II', 'Platinum II', 7200, 7599, '#00CED1'),
    ('Platinum I', 5, 'I', 'Platinum I', 7600, 7999, '#00CED1'),
    ('Diamond IV', 6, 'IV', 'Diamond IV', 8000, 8399, '#B9F2FF'),
    ('Diamond III', 6, 'III', 'Diamond III', 8400, 8799, '#B9F2FF'),
    ('Diamond II', 6, 'II', 'Diamond II', 8800, 9199, '#B9F2FF'),
    ('Diamond I', 6, 'I', 'Diamond I', 9200, 9599, '#B9F2FF'),
    ('Master', 7, NULL, 'Master', 9600, 9999, '#8A2BE2'),
    ('Grandmaster', 8, NULL, 'Grandmaster', 10000, 10399, '#FF4500'),
    ('Challenger', 9, NULL, 'Challenger', 10400, 99999, '#FF0000')
) AS rank_data(name, tier, division, division_name, min_mmr, max_mmr, color_hex)
WHERE g.slug = 'league-of-legends';
