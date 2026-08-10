# Dostlar Çempionatı — Futbol Turniri İdarəetmə Sistemi

Mobil-first, Firebase Realtime Database ilə işləyən real futbol turniri platforması.
React + Vite + Firebase (Realtime Database) ilə qurulub. Vercel, Netlify və digər statik hosting platformalarında deploy edilə bilər.

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

> Qeyd: Bu sadə şifrə yalnız brauzer tərəfində (client-side) yoxlanılır və `localStorage`-də saxlanılır — brauzer bağlanıb açılsa belə admin avtomatik daxil olur; "Çıxış" düyməsi sessiyanı silir. Daha ciddi mühafizə üçün Firebase Authentication (email/password) + Realtime Database Rules ilə real giriş sistemi qurmaq lazımdır.

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

## 3. Deploy (Vercel, Netlify və s.)

Layihə Vite ilə qurulub — `npm run build` çıxışı `dist/` qovluğudur və istənilən statik hosting-ə yüklənə bilər.

### Vercel
1. [vercel.com](https://vercel.com)-da GitHub repo-nu import edin (və ya `npm i -g vercel && vercel`).
2. Framework avtomatik **Vite** kimi tanınır (`build: npm run build`, `output: dist`).
3. İstəsəniz Settings → Environment Variables bölməsində `VITE_FIREBASE_*` dəyişənlərini təyin edin (boş qalsa kod daxilindəki standart config işləyir).
4. Repo-da hazır `vercel.json` var — SPA routing üçün bütün yollar `/index.html`-ə yönləndirilir (məs. `/teams`, `/archive` səhifəsini yenilədikdə 404 yoxdur).

### Netlify
1. Netlify-də repo-nu import edin.
2. Build command: `npm run build`, Publish directory: `dist`.
3. Hazır `netlify.toml` avtomatik SPA redirect (`/* → /index.html`) tətbiq edir.

### Digər platformalar
- `dist/` qovluğunu istənilən statik host-a (Firebase Hosting, Cloudflare Pages, GitHub Pages və s.) yükləyə bilərsiniz.
- Firebase Realtime Database Rules-i **2-ci bölmədəki** qaydaya uyğun qurun — əks halda admin yazımları işləməz.

## 4. Sistemin quruluşu

- `src/firebase.js` — Firebase konfiqurasiyası
- `src/store.jsx` — bütün database oxuma/yazma məntiqi (React Context, `useApp()` hook-u ilə istənilən komponentdən istifadə olunur)
- `src/lib/logic.js` — turnir "beyni": qrup bölgüsü, püşkatma, avtomatik playoff keçidi, xal cədvəli hesablanması
- `src/lib/upload.js` — Cloudinary ilə şəkil yükləmə
- `src/components/TournamentView.jsx` — turnir görünüşü: mərhələ yolu, qarşılaşma kartları və qrup kartları
- `src/pages/*` — səhifələr (Home, Teams, Archive, Admin)

## 5. İş axını (admin üçün)

1. `/admin`-dən daxil ol (şifrə: `gasham`).
2. **Komandalar** bölməsindən komanda əlavə et — ad + loqo URL, və ya **Şəkil yüklə** düyməsi ilə qalereyadan şəkil seç (Cloudinary-yə avtomatik yüklənir).
3. **Çempionat** bölməsindən **Çempionat yarat** — komandaları seç və **Qarşılaşma modu** (qruplar + playoff) formatını seç; sistem avtomatik püşkatma edib A, B, C... qruplarına bölür və oyunları yaradır.
4. Qarşılaşmaların nəticələrini daxil et — xal cədvəli (qələbə 3, heç-heçə 1, məğlubiyyət 0) avtomatik yenilənir. Nəticələri istənilən vaxt **redaktə** və ya **sıfırla** (tək oyun və ya bütün nəticələr).
5. Qrup mərhələsi bitdikdə playoff avtomatik formalaşır və komanda sayına uyğun mərhələdən başlayır (8 komanda → 1/4 Final, 16 komanda → 1/8 Final); hər raund bitdikdə növbəti mərhələ qurulur.
6. Final bitdikdə çempion müəyyənləşir, turnir tam məlumatla **Tarixçə / Arxiv** bölməsinə avtomatik köçürülür.
7. User paneldə `Tarixçə`dən əvvəlki turnirlərə baxmaq, Admin paneldə isə silmək mümkündür (təsdiq pəncərəsi ilə).

## 6. Nəyin daxil olduğu

Bu, real Firebase backend-i olan tam işlək sistemdir (məlumatlar Realtime Database-də saxlanılır və bütün istifadəçilər üçün canlı sinxronlaşır). Aşağıdakılar realdır və işləyir:

- Komanda CRUD; komandalar ayrıca saxlanılır və hər çempionatda yenidən istifadə olunur
- Cloudinary ilə şəkil yükləmə (qalereyadan seçim → URL avtomatik doldurulur)
- **Qarşılaşma modu**: komandalar təsadüfi qruplara bölünür (A, B, C...), qrup daxilində round-robin oyunları avtomatik yaradılır
- Qrup mərhələsi bitdikdə playoff avtomatik formalaşır; hər raund nəticələrə görə avtomatik irəliləyir
- Avtomatik xal cədvəli (qələbə 3, heç-heçə 1, məğlubiyyət 0) və nəticələrin redaktə/sıfırlanması
- Turnir bitdikdə avtomatik **arxivləşmə** (ad, tarix, komandalar, qruplar, oyunlar, nəticələr, xal cədvəli, final, çempion, statistikalar)
- Sadə, səliqəli mobil-first dizayn: mərhələ yolu, təmiz qarşılaşma kartları və qrup kartları
- Admin panel sadədir: yalnız **Komandalar / Çempionat / Tarixçə**

Oyunçu sistemi, canlı matç statusları (Canlı / Planlaşdırılıb), şərh və stadion/tarix sahələri bu versiyada bilərəkdən **tamamilə çıxarılıb**.
