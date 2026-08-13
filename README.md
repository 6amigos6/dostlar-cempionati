# Dostlar Çempionatı

Mobil-first, Firebase Realtime Database ilə işləyən sadə turnir platforması.
React + Vite + Firebase (Realtime Database). Vercel, Netlify və digər statik hostlarda işləyir.

## İşləmə məntiqi

1. Admin "Əlavə et" düyməsi ilə komanda yaradır (ad + isteğe bağlı profil şəkli).
   Komanda yaradan istifadəçinin hesabına bağlanır — **yalnız sahib** onu redaktə/silə bilər.
2. Admin komandaları seçib turniri başladır.
3. Sistem komandaları **təsadüfi** cütləşdirir (1-ci tur) — cütləşmələr animasiya ilə açılır.
4. Admin hər oyunun nəticəsini daxil edir.
5. Xal avtomatik hesablanır: **qələbə = 3, heç-heçə = 1, məğlubiyyət = 0**.
6. Tur bitəndə növbəti tur avtomatik qurulur — komandalar cədvələ görə sıralanır,
   **ən güclülər bir-biri ilə oynayır** (1-ci ilə 2-ci, 3-cü ilə 4-cü ...), əvvəllər oynamış cütlər təkrarlanmır.
7. Daha qarşılaşma qalmadıqda turnir bitir və **çempion** müəyyənləşir (cədvəlin birincisi).
8. Yeni turnir başlayanda köhnə turnir avtomatik **arxivləşir** (həm admin, həm user panelində tarixçə).

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

**Tələb olunan Firebase xidmətləri:**
- **Authentication → Sign-in method → Anonymous** aktivləşdirilməlidir
  (komanda sahibliyi anonim girişlə işləyir).
- **Realtime Database** yuxarıdakı kimi.

**Realtime Database Rules** (Firebase Console → Realtime Database → Rules) —
hazır nüsxə `firebase.rules.json` faylındadır:

```json
{
  "rules": {
    ".read": "auth != null",
    "teams": {
      "$teamId": {
        ".read": "auth != null",
        ".write": "auth != null && ((newData.exists() && newData.val().ownerId === auth.uid) || (!newData.exists() && data.exists() && data.val().ownerId === auth.uid))"
      }
    },
    "tournaments": {
      "$tournamentId": { ".read": "auth != null", ".write": "auth != null" }
    },
    "archive": {
      "$id": { ".read": "auth != null", ".write": "auth != null" }
    },
    "settings": {
      "$key": { ".read": "auth != null", ".write": "auth != null" }
    }
  }
}
```

Bu qaydalar komandanın yalnız **sahibi** tərəfindən dəyişdirilə biləcəyini backend-də
təmin edir (yalnız düymələri gizlətməklə deyil).

> **Qeyd:** Əgər Anonymous sign-in aktiv deyilsə, app cihaz əsaslı identifikatorla işləyir
> (funksionallıq itmir), amma bu qaydaların real qorunması üçün Anonymous sign-in
> aktivləşdirilib rules tətbiq edilməlidir.

> Köhnə komandalar (ownerId sahəsi olmayan) yalnız oxuna bilər — onları redaktə etmək
> üçün Firebase Console-dan həmin komandanın node-unə öz `ownerId` dəyərini yazın,
> ya da yeni komanda yaradın.

## Admin girişi

Saytın yuxarısındakı **Admin** düyməsi ilə birbaşa daxil olunur — şifrə tələb olunmur.
Turnir və komanda **silinməsi** təsdiq şifrəsi (**66**) tələb edir.

## Layihə quruluşu

- `src/firebase.js` — Firebase konfiqurasiyası (+ auth)
- `src/store.jsx` — database oxuma/yazma məntiqi (React Context, `useApp()` hook-u), anonim giriş, komanda sahibliyi
- `src/lib/logic.js` — turnir məntiqi: təsadüfi püşkatma, növbəti tur qurulması, xal cədvəli
- `src/lib/upload.js` — Cloudinary şəkil yüklənməsi (komanda profil şəkli)
- `src/lib/bracket.jsx` — SVG-siz, pure-CSS bracket (Safari/WebKit uyğun)
- `src/lib/archive.jsx` — tarixçə bölməsi (həm user, həm admin panelində)
- `src/pages/Home.jsx` — user panel: xal cədvəli, eşləşmə (bracket + yüklə), tarixçə
- `src/pages/Admin.jsx` — admin panel: komandalar, turnir, nəticələr, tarixçə
- `firebase.rules.json` — Realtime Database təhlükəsizlik qaydaları
