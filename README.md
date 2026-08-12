# Dostlar Çempionatı

Mobil-first, Firebase Realtime Database ilə işləyən sadə turnir platforması.
React + Vite + Firebase (Realtime Database). Vercel, Netlify və digər statik hostlarda işləyir.

## İşləmə məntiqi

1. Admin komandaların adlarını əlavə edir.
2. Admin komandaları seçib turniri başladır.
3. Sistem komandaları **təsadüfi** cütləşdirir (1-ci tur).
4. Admin hər oyunun nəticəsini daxil edir.
5. Xal avtomatik hesablanır: **qələbə = 3, heç-heçə = 1, məğlubiyyət = 0**.
6. Tur bitəndə növbəti tur avtomatik qurulur — komandalar cədvələ görə sıralanır,
   **ən güclülər bir-biri ilə oynayır** (1-ci ilə 2-ci, 3-cü ilə 4-cü ...), əvvəllər oynamış cütlər təkrarlanmır.
7. Daha qarşılaşma qalmadıqda turnir bitir və **çempion** müəyyənləşir (cədvəlin birincisi).
8. Yeni turnir başlayanda köhnə turnir avtomatik **arxivləşir**.

Bütün məlumatlar Firebase Realtime Database-də saxlanır — admin nəticə daxil edən kimi
heç bir yeniləmə tələb etmədən bütün cihazlarda xal və nəticələr canlı görünür.

## Quraşdırma

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

`dist/` qovluğunu istənilən statik hosta (Vercel, Netlify və s.) yükləyə bilərsiniz.

## Firebase quraşdırılması

Firebase konfiqurasiyası `src/firebase.js`-də daxildir. İstəsəniz `VITE_FIREBASE_*`
dəyişənlərini `.env`-də təyin edə bilərsiniz (boş qalsa standart config işləyir).

**Realtime Database Rules** (Firebase Console → Realtime Database → Rules):

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

## Admin girişi

Saytın yuxarısındakı **Admin** düyməsi ilə daxil olun. Şifrə: `gasham`.
Sessiya brauzerdə yadda saxlanılır.

## Layihə quruluşu

- `src/firebase.js` — Firebase konfiqurasiyası
- `src/store.jsx` — database oxuma/yazma məntiqi (React Context, `useApp()` hook-u)
- `src/lib/logic.js` — turnir məntiqi: təsadüfi püşkatma, növbəti tur qurulması, xal cədvəli
- `src/pages/Home.jsx` — user panel: xal cədvəli və qarşılaşmalar (canlı)
- `src/pages/Admin.jsx` — admin panel: komandalar, turnir, nəticələr, tarixçə
