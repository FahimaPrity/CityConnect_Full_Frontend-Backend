# City Connect — Full project
- `backend/`  : Django REST (Eutropia ComplaintManagement) — **unchanged**
- `frontend/` : React + Vite, connected to the backend

## Run
Terminal 1 (backend):
```
cd backend/ComplaintManagement
python -m venv .venv && .venv\Scripts\activate      # macOS/Linux: source .venv/bin/activate
pip install django==5.2.4 djangorestframework djangorestframework-simplejwt
python manage.py migrate
python manage.py runserver
```
(requirements.txt is UTF-16 encoded; if `pip install -r` fails, install the 3 packages above.)

Terminal 2 (frontend):
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173.

## Accounts
Existing DB users: `TasfiaToma` (customer), `agent` (agent). Citizens can register on the site.
Create an admin: `python manage.py shell` ->
`from accounts.models import User; u=User.objects.create_user('admin1',password='Admin12345'); u.role='admin'; u.save()`
(admin assigns tickets by typing the agent's user ID, e.g. agent = 2.)

## Backend issues found (not changed, as requested)
- `/api/notifications/` and `/api/logs/`: views/serializers are mis-indented (`get_queryset` outside the class, NotificationSerializer has no `Meta`), so they return errors. Frontend pages are wired and will work once fixed.
- No public/anonymous endpoints, no categories/wards, no "me" endpoint, no CORS (frontend uses the Vite proxy instead).
