# Frontend Setup Guide (React + Vite)

This guide helps you set up and run the frontend from scratch.

## 1. Prerequisites

- Node.js matching `.nvmrc` (`22.12.0`) or any version supported by `package.json`
- npm 9+
- Git
- Backend running locally (see `backend/BACKEND_SETUP.md`)

## 2. Clone and open project

```bash
git clone <your-repo-url>
cd tfd-frontend
```

## 3. Install dependencies

```bash
npm ci
```

## 4. Configure environment

A root `.env.example` already exists.

Create `.env` in the project root:

```bash
cp .env.example .env
```

Default value:

```env
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_LOCATIONIQ_KEY=
```

The default setup works for local development:

- frontend requests `/api` and `/uploads` from the Vite dev server
- Vite proxies those requests to `VITE_API_PROXY_TARGET`

If your backend runs on another port/host, update `VITE_API_PROXY_TARGET`.
If you want the frontend to call a fully hosted backend directly, set `VITE_API_BASE_URL` to the full API URL instead.

## 5. Run in development mode

```bash
npm run dev
```

Expected local URL (default Vite):

- http://localhost:5173

## 6. Build and preview production bundle

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

## 7. Lint check

```bash
npm run lint
```

## 8. Common frontend issues and fixes

### Issue: API calls fail (network/CORS)

- Confirm backend is running.
- Confirm `VITE_API_PROXY_TARGET` points to the running backend in development.
- If `VITE_API_BASE_URL` is absolute, confirm it is correct.
- Confirm backend `FRONTEND_ORIGINS` allows your frontend URL.

### Issue: Blank page or runtime error in browser

- Open browser DevTools Console and check the first error.
- Restart dev server:

```bash
# stop existing server with Ctrl + C, then
npm run dev
```

### Issue: Dependency corruption

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 9. Useful demo credentials

See:

- `backend/DEMO_USER_CREDENTIALS.md`

Use these for testing customer/provider login flows.

## 10. Recommended dev workflow

1. Start backend first.
2. Start frontend.
3. Login with demo accounts.
4. Run lint before committing.
