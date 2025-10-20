# Veritabanı Kurulum Rehberi

## 🚀 Hızlı Kurulum (Önerilen)

Eğer sadece temel giriş/kayıt sistemi istiyorsanız, `quick-setup.sql` dosyasını kullanın:

1. Supabase Dashboard'a gidin
2. Sol menüden **SQL Editor** seçin
3. **New Query** butonuna tıklayın
4. `database/quick-setup.sql` dosyasının içeriğini kopyalayın
5. **Run** butonuna tıklayın

## 🔧 Gelişmiş Kurulum

Eğer daha kapsamlı bir sistem istiyorsanız, `schema.sql` dosyasını kullanın:

1. Supabase Dashboard'a gidin
2. Sol menüden **SQL Editor** seçin
3. **New Query** butonuna tıklayın
4. `database/schema.sql` dosyasının içeriğini kopyalayın
5. **Run** butonuna tıklayın

## 📋 Oluşturulan Tablolar

### Hızlı Kurulum:
- ✅ `profiles` - Kullanıcı profilleri
- ✅ RLS politikaları
- ✅ Otomatik profil oluşturma
- ✅ Updated_at trigger'ları

### Gelişmiş Kurulum:
- ✅ `profiles` - Kullanıcı profilleri
- ✅ `user_preferences` - Kullanıcı tercihleri
- ✅ `user_activities` - Kullanıcı aktiviteleri
- ✅ `user_sessions` - Kullanıcı oturumları
- ✅ Tüm RLS politikaları
- ✅ Helper fonksiyonlar
- ✅ Performans indexleri

## 🔍 Test Etme

Kurulum tamamlandıktan sonra:

1. Projeyi çalıştırın: `npm run dev`
2. `http://localhost:3000/register` adresine gidin
3. Yeni bir kullanıcı kaydı oluşturun
4. Supabase Dashboard > Table Editor > profiles tablosunu kontrol edin
5. Yeni kullanıcının otomatik olarak eklendiğini göreceksiniz

## 🛠️ Sorun Giderme

### Yaygın Hatalar:

1. **"relation does not exist"**: SQL'i tekrar çalıştırın
2. **"permission denied"**: Supabase proje ayarlarını kontrol edin
3. **"trigger already exists"**: Önce mevcut trigger'ları silin

### Debug İçin:

```sql
-- Tabloları kontrol et
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- RLS politikalarını kontrol et
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Trigger'ları kontrol et
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 📊 Veritabanı Yapısı

```
auth.users (Supabase tarafından yönetilen)
    ↓
profiles (Kullanıcı profilleri)
    ↓
user_preferences (Kullanıcı tercihleri)
    ↓
user_activities (Aktivite logları)
    ↓
user_sessions (Oturum yönetimi)
```

## 🔐 Güvenlik

- ✅ Row Level Security (RLS) aktif
- ✅ Kullanıcılar sadece kendi verilerini görebilir
- ✅ Otomatik profil oluşturma
- ✅ Güvenli trigger'lar
- ✅ SQL injection koruması
