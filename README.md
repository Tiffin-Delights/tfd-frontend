# TFDF Frontend

This repository contains a simple React/Vite frontend that demonstrates a marketing-style landing page using a warm, earthy color palette.

## Setup Guides

- Frontend detailed setup: `FRONTEND_SETUP.md`
- Backend detailed setup: `backend/BACKEND_SETUP.md`

## 🚀 Getting Started (for beginners)

This section walks through every step required to get the project up and running on a fresh machine. Don’t worry if you’re new to Git, Node, or npm — just follow the commands in order.

### ✅ Prerequisites

1. **Install Git**
   - macOS: use [Homebrew](https://brew.sh/) (`brew install git`) or download from [git-scm.com](https://git-scm.com/download/mac).
   - Verify by running:
     ```bash
     git --version
     ```

2. **Install Node.js** (v18 or newer)
   - Recommended method (version manager):
     ```bash
     # install nvm if you don't have it already
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
     source ~/.nvm/nvm.sh

     # install and use the latest long-term release
     nvm install --lts
     nvm use --lts
     ```
   - Alternatively download the installer from [nodejs.org](https://nodejs.org/).
   - Check your version:
     ```bash
     node --version   # should print 18.x or higher
     npm --version    # npm comes bundled with Node
     ```


### 📁 Clone the repository

```bash
# replace <repo-url> with the URL of this project (e.g. from GitHub)
git clone <repo-url>
cd tfd-frontend
```

### 📦 Install project dependencies

```bash
npm install      # downloads packages listed in package.json
# or if you use yarn:
# yarn
```

> If you run into errors, try removing `node_modules` and reinstalling:
> ```bash
> rm -rf node_modules package-lock.json
> npm install
> ```

### 🚧 Start the development server

```bash
npm run dev
```

- After the command finishes you can open your browser at
  `http://localhost:5173`.
- The server watches your files; save changes and the page will reload automatically.

### 🛠 Build & preview a production bundle

1. Build:
   ```bash
   npm run build
   ```
   Output appears in the `dist/` directory.

2. Preview the built site locally:
   ```bash
   npm run preview
   ```

### 🧹 Lint the codebase

```bash
npm run lint
```

- This checks for simple coding mistakes using ESLint.
- Run before committing to keep the code clean.

---

After completing the above steps, you’ll have a running copy of the project on your machine. If anything is unclear, ask a teammate or open an issue — everyone started as a beginner! 😊
## 🎨 Color Palette

The design uses a warm, earthy palette throughout the CSS. Key colors are:

| Role / Usage            | Hex Code   | Example
|-------------------------|------------|--------|
| Background gradient 1   | `#fff8ec`  | light cream
| Background gradient 2   | `#fffefb`  | off-white
| Primary text            | `#1a1a1a`  | dark gray
| Headings / Accents      | `#134222`  | forest green
| Eyebrow / Stats         | `#7d2f37`  | deep red
| Body text / secondary   | `#3a3a3a`  | medium gray
| Button primary           | `#ffb53e`  | amber
| Card backgrounds         | `#fff7e7`  | pale cream
| Border / shadows accent  | `rgba(174, 117, 2, 0.574)` etc.

> These colors can be found in `src/App.css` and are used throughout the components for consistency.

## 📁 Project Structure

```
src/
  components/    ← React components (Navbar, Footer, Hero, etc.)
  assets/        ← Images and static assets
  App.jsx        ← Root component
  main.jsx       ← Vite entry point
  App.css        ← Global styles and palette definitions
```

## 🧩 Tips

- The project uses React 19 with the official Vite React plugin.
- ESLint is set up for basic code quality; run `npm run lint` before committing.
- Change the color palette in `src/App.css` if you wish to rebrand.

---

Feel free to open issues or modify as needed. Happy hacking! 🎉

## Backend (FastAPI + PostgreSQL)

Backend code is available in [backend](backend).

### Quick start

1. Move to backend:
  - `cd backend`
2. Create and activate virtualenv.
3. Install dependencies:
  - `pip install -r requirements.txt`
4. Set env values in `.env` (or copy from `.env.example`):
  - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tiffin`
5. Run server:
  - `uvicorn app.main:app --reload --port 8000`

### Frontend API base URL

Set this in frontend `.env` if needed:

- `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`