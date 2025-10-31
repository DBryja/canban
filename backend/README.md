# TaskMaster Backend

Backend API dla aplikacji TaskMaster zbudowany na Bun i Elysia.

## Uruchomienie

1. Zainstaluj zależności:

```bash
bun install
```

2. Skonfiguruj zmienne środowiskowe:
   Skopiuj `.env.example` do `.env` i uzupełnij wartości.

3. Uruchom bazę danych (PostgreSQL w Dockerze):

```bash
docker-compose up -d
```

4. Wygeneruj klienta Prisma i zastosuj migracje:

```bash
bun run db:generate
bun run db:push
```

5. Uruchom serwer deweloperski:

```bash
bun run dev
```

API będzie dostępne na `http://localhost:3001`

## Dostępne endpointy

- `GET /` - Strona główna API
- `GET /health` - Health check
- `GET /health/db` - Health check bazy danych
