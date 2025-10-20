-- =============================================
-- BOOST GEM DATABASE SCHEMA
-- =============================================

-- 1. Kullanıcı profilleri tablosu
-- Bu tablo auth.users tablosunu genişletir
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Kullanıcı tercihleri tablosu
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  newsletter BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'tr',
  timezone TEXT DEFAULT 'Europe/Istanbul',
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Kullanıcı aktiviteleri tablosu (log için)
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Kullanıcı oturumları tablosu
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB,
  ip_address INET,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Profiles tablosu için RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi profillerini görebilir
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Kullanıcılar sadece kendi profillerini ekleyebilir
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User preferences için RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User activities için RLS
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activities" ON user_activities
  FOR INSERT WITH CHECK (true);

-- User sessions için RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Yeni kullanıcı kaydında otomatik profil oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  
  INSERT INTO public.user_preferences (id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_activities (user_id, activity_type, activity_data)
  VALUES (
    NEW.id, 
    'user_registered',
    jsonb_build_object(
      'email', NEW.email,
      'provider', COALESCE(NEW.app_metadata->>'provider', 'email'),
      'created_at', NEW.created_at
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluşturma
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_preferences
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Profiles tablosu için indexler
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- User activities için indexler
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

-- User sessions için indexler
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Kullanıcı profil bilgilerini getiren fonksiyon
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  is_verified BOOLEAN,
  is_premium BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.website,
    p.location,
    p.phone,
    p.birth_date,
    p.gender,
    p.is_verified,
    p.is_premium,
    p.created_at
  FROM profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcı aktivitesi kaydetme fonksiyonu
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_activity_data JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activities (user_id, activity_type, activity_data, ip_address, user_agent)
  VALUES (p_user_id, p_activity_type, p_activity_data, p_ip_address, p_user_agent)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SAMPLE DATA (OPSIYONEL)
-- =============================================

-- Test kullanıcısı için örnek veri (sadece development için)
-- INSERT INTO profiles (id, username, full_name, bio) 
-- VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   'test_user',
--   'Test User',
--   'Bu bir test kullanıcısıdır'
-- ) ON CONFLICT (id) DO NOTHING;
