# City Connect — React frontend (connected to the Django backend)
```
npm install
npm run dev        # http://localhost:5173  (proxies /api -> http://127.0.0.1:8000)
```
Start the backend first (see ../README.md). Routes: public (`/`, `/about`, `/complaints/new`, `/track`, `/resolved-complaints`, `/login`, `/register`), citizen (`/citizen/*`), agent (`/agent/*`), admin (`/admin/*`), shared (`/notifications`, `/activity`). API list: `docs/API_CONTRACT.md`.
