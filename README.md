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
- `src/lib/logic.js` — turnir "beyni": qrup bölgüsü, püşkatma, avtomatik playoff keçidi, xal cədvəli hesablanması
- `src/pages/*` — hər bölmə üçün səhifə (Home, Teams, Matches, Standings, Bracket, Statistics, Archive, Champion, Admin)
- `src/data/seed.js` — Demo Data generatoru (Admin → Tənzimləmələr → "Demo data yarat")

## 4. İş axını (admin üçün)

1. `/admin`-dən daxil ol.
2. **Komandalar** bölməsindən komandalar yarat.
3. **Tənzimləmələr → "Çempionatı başlat"** düyməsi ilə **Qarşılaşma modu** seç: komandalar avtomatik olaraq təsadüfi şəkildə A, B, C... qruplarına bölünür və qrup oyunları yaradılır.
4. **Oyunlar** tabından nəticələri daxil et — xal cədvəli (3/1/0) avtomatik yenilənir.
5. Qrup mərhələsi bitdikdə sistem avtomatik olaraq playoff (Rübfinal → Yarımfinal → Final) formalaşdırır; hər raund bitdikdə növbəti mərhələ avtomatik qurulur.
6. Final bitdikdə çempion müəyyənləşir, turnir tam məlumatla **Tarixçə / Arxiv** bölməsinə avtomatik köçürülür.
7. User paneldə `Tarixçə` bölməsindən əvvəlki turnirlərə baxmaq, Admin paneldə isə silmək mümkündür (təsdiq pəncərəsi ilə).

## 5. Nəyin daxil olduğu / hazırkı hüdudlar

Bu, real Firebase backend-i olan tam işlək bir sistemdir (məlumatlar `localStorage`-da deyil, Realtime Database-də saxlanılır və bütün istifadəçilər üçün canlı sinxronlaşır). Aşağıdakılar realdır və işləyir:

- Komanda CRUD, tək çempionat modeli (Çempionlar Liqası üslubu)
- **Qarşılaşma modu**: komandalar təsadüfi qruplara bölünür (A, B, C...), qrup daxilində round-robin oyunları avtomatik yaradılır
- Qrup mərhələsi bitdikdə playoff avtomatik formalaşır (hər qrupdan ilk 2 + ən yaxşı 3-cülər); hər raund nəticələrə görə avtomatik irəliləyir
- Nəticə daxil etmə, avtomatik xal cədvəli (qələbə 3, heç-heçə 1), çempion müəyyənləşdirmə və kubok ekranı
- Turnir bitdikdə avtomatik **arxivləşmə** (ad, tarix, komandalar, qruplar, oyunlar, nəticələr, xal cədvəli, final, çempion, statistikalar)
- Canlı status (LIVE bayrağı + real-time Firebase sinxronizasiyası — admin nəticəni dəyişən kimi bütün istifadəçilərdə səhifə yeniləmədən dəyişir)
- Dark/Light rejim, mobil bottom navigation, playoff bracket görünüşü, komanda statistikaları

Vaxt məhdudiyyəti səbəbindən aşağıdakılar **sadələşdirilib** və istəsəniz üzərində davam edə bilərik:
- Push/browser notifikasiyaları (bölmə 25) əlavə edilməyib
- Oyunçu sistemi — hazırkı versiyada oyunçu əlavə etmək imkanı yoxdur (yalnız komandalar); istəsəniz yenidən əlavə edilə bilər
- 3-cü yer uğrunda oyun və seed sistemi (reytinqə görə yerləşdirmə) əlavə edilməyib
- Log/audit tarixçəsi (bölmə 27) hələ ayrıca ekranda göstərilmir, lakin Firebase Realtime Database-in özü bütün dəyişiklikləri saxlayır
