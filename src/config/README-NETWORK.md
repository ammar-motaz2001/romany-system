# How to see the Login API request in DevTools Network tab

## What you're seeing now (and what it is)

| What appears in Network | Type      | What it really is                          |
|------------------------|-----------|--------------------------------------------|
| `login` (200 document) | document  | The **page** for route `/login` (HTML/SPA) — **not** the backend API |
| `?token=...` (websocket) | websocket | **Vite HMR** (hot reload) — not auth       |
| `main.tsx`, `App.tsx`, `AppContext.tsx`, etc. | script | **Vite dev server** serving your JS/CSS   |

So far you are only seeing **page load + frontend assets**. The **login API call** is a separate request.

---

## How to see the actual Login API request

1. Open **DevTools** → **Network** tab.
2. In the filter row, click **"Fetch/XHR"** (or "XHR") so only **API requests** are shown (no documents, scripts, or websockets).
3. Enter username and password in the form, then click **"Login"** (or تسجيل الدخول).
4. You should see a new row, for example:
   - **Name:** `login` or `auth` (depends on backend)
   - **Status:** 200 (success) or 4xx/5xx (error)
   - **Type:** fetch or xhr
   - **URL:** something like `https://backend-twice.vercel.app/api/auth/login` or `http://localhost:5001/api/auth/login`

That row is the **POST request to your backend login endpoint**.

---

## Summary

- **"login" 200 document** = loading the login **page** (frontend).
- **POST .../api/auth/login** (Fetch/XHR) = the **login API call** to your backend (only after you click Login).

Filter by **Fetch/XHR** and click **Login** to see the API request.
