# Supabase Kurulum Rehberi

## 1. Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) sitesine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. "New Project" butonuna tıklayın
5. Proje adını girin (örn: "boost-gem")
6. Güçlü bir veritabanı şifresi oluşturun
7. Bölge seçin (Türkiye için "Europe West" önerilir)
8. "Create new project" butonuna tıklayın

## 2. API Anahtarlarını Alma

1. Supabase dashboard'da projenizi seçin
2. Sol menüden "Settings" > "API" seçin
3. Aşağıdaki anahtarları kopyalayın:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (uzun bir string)

## 3. Environment Variables Ayarlama

1. Proje dizininizde `.env.local` dosyası oluşturun
2. Aşağıdaki değerleri doldurun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Authentication Ayarları

1. Supabase dashboard'da "Authentication" > "Settings" seçin
2. "Site URL" kısmına `http://localhost:3000` ekleyin
3. "Redirect URLs" kısmına şunları ekleyin:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`

## 5. Veritabanı Şeması (Opsiyonel)

Eğer ek kullanıcı bilgileri saklamak istiyorsanız, aşağıdaki SQL'i Supabase SQL Editor'da çalıştırın:

```sql
-- Kullanıcı profilleri için tablo oluşturma
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) politikaları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi profillerini görebilir
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Kullanıcılar sadece kendi profillerini güncelleyebilir
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Yeni kullanıcı kaydında otomatik profil oluşturma
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluşturma
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 6. Test Etme

1. Projeyi çalıştırın: `npm run dev`
2. `http://localhost:3000` adresine gidin
3. "Kayıt Ol" butonuna tıklayın
4. Test e-postası ve şifre ile kayıt olun
5. E-postanızı kontrol edin ve doğrulama linkine tıklayın
6. Giriş yapın ve dashboard'a erişin

## 7. Güvenlik Notları

- `.env.local` dosyasını asla git'e commit etmeyin
- Production'da güçlü şifreler kullanın
- RLS politikalarını dikkatli bir şekilde ayarlayın
- API anahtarlarınızı güvenli tutun

## 8. Sorun Giderme

### Yaygın Hatalar:

1. **"Invalid API key"**: API anahtarınızı kontrol edin
2. **"Site URL not allowed"**: Authentication settings'de URL'leri kontrol edin
3. **"Email not confirmed"**: E-posta doğrulama linkine tıklayın
4. **CORS hatası**: Supabase dashboard'da site URL'lerini kontrol edin

### Debug İçin:

```javascript
// Console'da Supabase bağlantısını test etme
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
console.log('Supabase client:', supabase)
```
