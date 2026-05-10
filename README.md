# Sprint Manager

A lightweight sprint/task management app for small engineering teams.

## Stack

- **Backend**: FastAPI, Beanie ODM, MongoDB (Motor async driver)
- **Frontend**: React + TypeScript + Vite, Tailwind CSS, @dnd-kit
- **Auth**: JWT (bcrypt + python-jose)

## Local Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in MONGODB_URL and SECRET_KEY in .env

uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

> MongoDB must be running locally (`mongod`) or provide an Atlas connection string.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## Architecture

```
backend/
  app/
    api/routes/   # auth, projects, tasks, dashboard
    core/         # config, database, security
    models/       # SQLAlchemy ORM models
    schemas/      # Pydantic request/response schemas
    main.py

frontend/
  src/
    pages/        # LoginPage, SignupPage, DashboardPage, ProjectsPage, ProjectPage
    components/   # Layout, TaskCard, TaskModal
    lib/          # axios instance, utils
    store/        # Zustand auth store
    types/        # shared TypeScript types
```

## Tradeoffs

- Used `Base.metadata.create_all` for simplicity — Alembic migrations would be used in production
- Auth is per-user project isolation (no team/org model) — intentional scope reduction
