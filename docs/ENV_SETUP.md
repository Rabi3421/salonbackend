# Environment Setup

## Required Server-Side Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `SUPERADMIN_JWT_SECRET` | JWT secret for superadmin tokens (min 32 chars) |
| `SALON_JWT_SECRET` | JWT secret for salon user tokens (min 32 chars) |
| `SUPERADMIN_NAME` | Default superadmin display name |
| `SUPERADMIN_EMAIL` | Default superadmin login email |
| `SUPERADMIN_PHONE` | Default superadmin phone |
| `SUPERADMIN_PASSWORD` | Default superadmin password (auto-seeded on first login) |
| `NODE_ENV` | `development` or `production` |

## Public/Client-Safe Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_NAME` | App display name (default: "Salon Management") |
| `NEXT_PUBLIC_API_URL` | Base API URL for external consumers |

## Rules

- **Never commit `.env`** — use `.env.example` as template
- **Rotate secrets** before deploying to production
- Use **strong random strings** (32+ characters) for JWT secrets
- Use a **production MongoDB URI** with authentication enabled
- Server env variables must **never** appear in client components
- The default superadmin is auto-created on first login attempt if not found

## Setup

```bash
cp .env.example .env
# Fill in actual values
npm install
npm run dev
```
