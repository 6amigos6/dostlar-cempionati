# Dostlar Çempionatı 🏆

Dostlar arasında keçirilən futbol çempionatları üçün sadə, vizual, mobil-first
sayt. Next.js 14 (App Router) + TypeScript + Tailwind CSS + Firebase Realtime
Database ilə qurulub.

## Xüsusiyyətlər

- **İctimai səhifə (`/`)** — böyük kubok, qruplar, xal cədvəli, qarşılaşmalar,
  çempion animasiyası, hamısı Firebase-dən **real vaxtda** yenilənir.
- **Admin panel (`/admin`)** — şifrə ilə qorunur, 3 sadə bölmə:
  - **Komandalar** — əlavə et / redaktə et / sil (Firebase-də daimi saxlanılır,
    gələcək turnirlərdə yenidən istifadə olunur).
  - **Çempionat** — komandaları seç, qrup sayını təyin et, sistem avtomatik
    təsadüfi qruplaşdırma və round-robin qarşılaşmalar yaradır. Nəticə daxil
    etdikcə xal cədvəli avtomatik yenilənir. Bütün oyunlar bitəndə (və ya
    "Turniri bitir" düyməsi ilə) sistem avtomatik çempionu müəyyən edir.
  - **Tarixçə** — bitmiş turnirlər arxivlənir, yalnız oxumaq üçündür.
- Oyunçu sistemi, əlavə statistika və mürəkkəb dashboard **yoxdur** — istəyə
  görə maksimal sadə saxlanılıb.

## Qurulum

```bash
npm install
npm run dev
```

Sayt `http://localhost:3000` ünvanında açılacaq.

### Mühit dəyişənləri

Firebase konfiqurasiyası və admin şifrəsi `.env.local` faylında saxlanılır
(artıq doldurulub, layihə ilə birlikdə gəlir). Nümunə üçün `.env.local.example`
faylına bax:

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_ADMIN_PASSWORD=
```

Admin şifrəsini dəyişmək üçün `NEXT_PUBLIC_ADMIN_PASSWORD` dəyərini yenilə.

## Firebase Realtime Database strukturu

```
teams/{teamId}            → { name, image }
currentTournament         → { id, name, status, teams[], groups{}, matches{}, champion, createdAt }
history/{tournamentId}    → currentTournament-un arxivlənmiş surəti
```

Firebase konsolunda Realtime Database qaydalarını layihənin ehtiyacına uyğun
tənzimləməyi unutma (test rejimində hamı yaza bilər — məhsula keçməzdən əvvəl
məsələn admin yazma girişini məhdudlaşdırmaq faydalıdır).

## Vercel-ə deploy

```bash
npm run build
```

Layihəni GitHub-a push et və Vercel-də import et, ya da:

```bash
npx vercel
```

Vercel paneldə yuxarıdakı mühit dəyişənlərini `Environment Variables`
bölməsində əlavə etməyi unutma.

## Fayl strukturu

```
src/
  app/
    layout.tsx        → şrift və qlobal stil
    page.tsx           → ictimai səhifə
    admin/page.tsx      → admin panel
    globals.css
  components/
    TrophyHero.tsx
    ChampionBanner.tsx
    GroupsSection.tsx
    MatchesSection.tsx
    HistorySection.tsx
    Confetti.tsx
    PublicSite.tsx
    admin/
      AdminApp.tsx
      TeamsTab.tsx
      TournamentTab.tsx
  hooks/
    useFirebaseValue.ts → realtime Firebase abunəlik hook-u
  lib/
    firebase.ts
    types.ts
    standings.ts        → xal cədvəli / sıralama məntiqi
    teamActions.ts
    tournamentActions.ts
```
