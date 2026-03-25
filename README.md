# Galați Sesizări — Platformă urbană

Platformă web pentru raportarea problemelor locale din Municipiul Galați.

## Setup pentru colegi noi (5 minute)

### 1. Clonează repo-ul
```bash
git clone <url-repo>
cd galati-reports
```

### 2. Instalează dependențele
```bash
npm install
```

### 3. Configurează variabilele de mediu
```bash
cp .env.example .env
```
Deschide `.env` și completează cu valorile din **Supabase Dashboard → Settings → API**
(cere cheile de la colegul care a creat proiectul Supabase).

### 4. Pornește serverul de development
```bash
npm run dev
```

Aplicația rulează la **http://localhost:5173**

---

## Stack tehnic

| Tehnologie | Rol |
|---|---|
| React 18 + Vite 8 | Frontend |
| React Router v6 | Navigare |
| Supabase | Auth + PostgreSQL + Storage |
| Leaflet / react-leaflet | Hartă interactivă |

## Structura proiectului

```
src/
  components/    # Componente reutilizabile (Navbar, MapSection, etc.)
  context/       # AuthContext — starea globală a userului
  lib/           # supabaseClient.js, useReports.js (hooks utilitare)
  pages/         # O pagină per rută
```

## Comenzi utile

```bash
npm run dev      # Server development cu HMR
npm run build    # Build producție
npm run preview  # Preview build local
```

## Roluri utilizatori

- **citizen** — implicit la înregistrare
- **admin** — setat manual în Supabase:
  ```sql
  UPDATE profiles SET role = 'admin' WHERE id = '<uuid-user>';
  ```

## Important pentru echipă

- **Nu comite `.env`** niciodată — doar `.env.example`
- Dacă adaugi o pagină nouă → adaug-o în `App.jsx` cu `lazy()`
- Hooks de date reutilizabile → `src/lib/useReports.js`
