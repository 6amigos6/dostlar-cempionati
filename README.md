# Çempionlar Liqası — Turnir İdarəetmə Sistemi

Mobil-first, Firebase Realtime Database ilə işləyən futbol çempionatı idarəetmə platforması.
React + Vite + Firebase (Realtime Database) ilə qurulub.

## 1. Quraşdırma

```bash
npm install
npm run dev
```

Brauzerdə `http://localhost:5173` açın. Mobil görünüşü görmək üçün brauzerin developer tools → mobile emülyasiyasından istifadə edin, ya da telefonunuzdan eyni Wi-Fi şəbəkəsində `npm run dev -- --host` ilə açın.

Production build üçün:
```bash
npm run build
npm run preview
```
`dist/` qovluğunu istənilən statik hosting-ə (Firebase Hosting, Vercel, Netlify) yükləyə bilərsiniz.

## 2. Firebase quraşdırılması (VACİB)

Kodda artıq sizin verdiyiniz Firebase config (`src/firebase.js`) daxil edilib. Amma layihənin işləməsi üçün Firebase Console-da 2 şeyi etməlisiniz:

### a) Admin şifrəsi
1. Saytda `/admin` səhifəsinə keçin.
2. Şifrə sahəsinə `gasham` yazıb **Daxil ol** düyməsinə basın.

> Qeyd: Bu sadə şifrə yalnız brauzer tərəfində (client-side) yoxlanılır və `sessionStorage`-də saxlanılır. Daha ciddi mühafizə üçün Firebase Authentication (email/password) + Realtime Database Rules ilə real giriş sistemi qurmaq lazımdır.

### b) Realtime Database Rules
Console → **Realtime Database** → **Rules** bölməsinə keçib aşağıdakını yapışdırın (hər kəs oxuya bilsin, admin paneldən yazımlar işləsin):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> Qeyd: Admin panel artıq Firebase Authentication-dan istifadə etmədiyi üçün Rules-də `.write: "auth != null"` qalsa, admin paneldən yazılan məlumatlar geri çevriləcək (icazə xətası). Məlumatların tam ictimai olmasını istəmirsinizsə, Firebase Authentication ilə real admin girişi qurun.

## 3. Sistemin quruluşu

- `src/firebase.js` — Firebase konfiqurasiyası
- `src/store.jsx` — bütün database oxuma/yazma məntiqi (React Context, `useApp()` hook-u ilə istənilən komponentdən istifadə olunur)
- `src/lib/logic.js` — turnir "beyni": püşkatma, bracket qurulması, xal cədvəli hesablanması
- `src/pages/*` — hər bölmə üçün səhifə (Home, Teams, Players, Matches, Standings, Bracket, Statistics, Champion, Admin)
- `src/data/seed.js` — Demo Data generatoru (Admin → Tənzimləmələr → "Demo data yarat")

## 4. İş axını (admin üçün)

1. `/admin`-dən daxil ol.
2. **Komandalar** bölməsindən komandalar yarat.
3. **Oyunçular** bölməsindən oyunçular əlavə et (sadəcə ad, nömrə, mövqe, komanda, profil şəkli) və komandalara təyin et.
4. **Tənzimləmələr → "Çempionatı başlat"** düyməsi ilə bütün komandalarla yeni çempionat başlat (Playoff və ya Liqa formatı). Püşkatma avtomatik çəkilir.
5. **Oyunlar** tabından hər oyuna tarix/saat/stadion əlavə et, nəticə daxil et, lazım gələrsə qol/assist/kart hadisələri qeyd et.
6. Bir mərhələnin bütün oyunları bitdikdə **"Növbəti mərhələ →"** düyməsi avtomatik yarımfinal/final yaradır.
7. Final bitdikdə sistem çempionu avtomatik müəyyənləşdirir (`/champion` səhifəsi açılır).

## 5. Nəyin daxil olduğu / hazırkı hüdudlar

Bu, real Firebase backend-i olan tam işlək bir sistemdir (məlumatlar `localStorage`-da deyil, Realtime Database-də saxlanılır və bütün istifadəçilər üçün canlı sinxronlaşır). Aşağıdakılar realdır və işləyir:

- Tək çempionat modeli (Çempionlar Liqası üslubu): komanda/oyunçu CRUD, avtomatik püşkatma (bracket) və liqa/round-robin cədvəli yaradılması
- Nəticə daxil etmə, avtomatik xal cədvəli, avtomatik mərhələ keçidi, çempion müəyyənləşdirmə
- Canlı status (LIVE bayrağı + real-time Firebase sinxronizasiyası — admin nəticəni dəyişən kimi bütün istifadəçilərdə səhifə yeniləmədən dəyişir)
- Dark/Light rejim, mobil bottom navigation, playoff bracket görünüşü, statistika lider lövhələri (qol/assist/kart)

Vaxt məhdudiyyəti səbəbindən aşağıdakılar **sadələşdirilib** və istəsəniz üzərində davam edə bilərik:
- Push/browser notifikasiyaları (bölmə 25) əlavə edilməyib
- Çox-turnir sistemi və arxiv/Hall of Fame — hazırkı versiyada tək aktiv çempionat saxlanılır; çempionat bitdikdə "Çempionatı sil" ilə yenisi başladıla bilər
- Qrup + Playoff formatı — hazırkı versiyada Playoff (birbaşa bracket) və Liqa (round-robin) formatları dəstəklənir
- Log/audit tarixçəsi (bölmə 27) hələ ayrıca ekranda göstərilmir, lakin Firebase Realtime Database-in özü bütün dəyişiklikləri saxlayır
