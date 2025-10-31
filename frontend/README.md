# TaskMaster Frontend

Frontend aplikacji TaskMaster zbudowany na React + TypeScript + Vite + shadcn/ui.

## Uruchomienie

1. Zainstaluj zależności:

```bash
npm install
# lub
bun install
```

2. Skonfiguruj zmienne środowiskowe:
   Utwórz plik `.env` z następującą zawartością:

```
VITE_API_URL=http://localhost:3001
```

3. Uruchom serwer deweloperski:

```bash
npm run dev
# lub
bun run dev
```

Aplikacja będzie dostępna na `http://localhost:3000`

## Dodawanie komponentów shadcn/ui

Aby dodać komponenty z shadcn/ui, możesz zainstalować shadcn-ui init:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add [component-name]
```

Albo dodawać komponenty ręcznie do `src/components/ui/`.
