# Deep Trace Cybernetics

A Multi-Tenant Security Management Platform built using React, TypeScript, Node.js, Express, PostgreSQL, Prisma ORM, JWT Authentication, and Role-Based Access Control (RBAC).

---

# Features

- Multi-Tenant Architecture
- JWT Authentication
- Role-Based Authorization
- User Management
- Campaign Management
- Security Event Management
- Audit Logging
- Dashboard Metrics
- Tenant Isolation
- Pagination & Filtering
- Secure Password Hashing

---

# Tech Stack

## Frontend

- React
- TypeScript
- React Router
- Axios
- CSS

## Backend

- Node.js
- Express.js
- Prisma ORM
- JWT
- bcrypt

## Database

- PostgreSQL

---

# Project Structure

```text
deeptrace-security-platform/

├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── routes/
│   └── package.json
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   │
│   └── package.json
│
└── README.md
```

---

# Environment Variables

## Backend (.env)

```env
PORT=5000

DATABASE_URL=postgresql://postgres:password@localhost:5432/deeptrace_db

JWT_SECRET=deeptrace_super_secret
```

## Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

# .env.example

## Backend

```env
PORT=
DATABASE_URL=
JWT_SECRET=
```

## Frontend

```env
VITE_API_URL=
```

---

# Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE deeptrace_db;
```

Run migrations:

```bash
npx prisma migrate dev
```

Generate Prisma Client:

```bash
npx prisma generate
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# Backend Setup

Install dependencies:

```bash
cd backend

npm install
```

Run development server:

```bash
npm run dev
```

Run production server:

```bash
npm start
```

Backend URL:

```text
http://localhost:5000
```

---

# Frontend Setup

Install dependencies:

```bash
cd frontend

npm install
```

Run frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

# Sample Seed Data

Create Tenant:

```sql
INSERT INTO "Tenant" ("name")
VALUES ('Deep Trace Cybernetics');
```

---

# Sample Credentials

## Admin

```text
Email: admin@deeptrace.com
Password: Admin123
Role: ADMIN
```

## Manager

```text
Email: manager@deeptrace.com
Password: Manager123
Role: MANAGER
```

## User

```text
Email: user@deeptrace.com
Password: User123
Role: USER
```

---

# API Modules

## Authentication

- Register
- Login
- Current User

## Users

- Create User
- List Users
- Update User
- Delete User

## Campaigns

- Create Campaign
- List Campaigns
- Update Campaign
- Delete Campaign
- Assign User
- Remove User

## Security Events

- Create Event
- View Events
- Update Event
- Delete Event

## Audit Logs

- Login Activity
- User Creation
- Campaign Activity

---

# Architecture Overview

```text
React Frontend
       │
       │
       ▼
Express REST API
       │
       │
       ▼
JWT Authentication
RBAC Authorization
       │
       ▼
Prisma ORM
       │
       ▼
PostgreSQL
```

---

# Key Design Decisions

## Multi-Tenant Architecture

Every business entity contains a tenantId.

Examples:

- User
- Campaign
- SecurityEvent
- AuditLog

This ensures strict separation of tenant data.

---

## JWT Authentication

Users receive JWT access tokens after login.

Payload:

```json
{
  "userId": 1,
  "tenantId": 1,
  "role": "ADMIN"
}
```

Every protected request uses:

```http
Authorization: Bearer <token>
```

---

## Role-Based Access Control

Roles:

```text
ADMIN
MANAGER
USER
```

### Permissions Matrix

| Feature | ADMIN | MANAGER | USER |
|----------|----------|----------|----------|
| View Dashboard | Yes | Yes | Yes |
| View Campaigns | Yes | Yes | Yes |
| Create Campaign | Yes | Yes | No |
| Edit Campaign | Yes | Yes | No |
| Delete Campaign | Yes | No | No |
| View Events | Yes | Yes | Yes |
| Create Events | Yes | Yes | No |
| Manage Users | Yes | No | No |
| View Audit Logs | Yes | Yes | No |

---

# Security Considerations

## Password Hashing

Passwords are hashed using bcrypt.

```javascript
bcrypt.hash(password, 10)
```

Passwords are never stored in plain text.

---

## Authentication

JWT-based authentication protects all APIs.

```http
Authorization: Bearer token
```

---

## Authorization

Role middleware prevents unauthorized access.

```javascript
roleMiddleware("ADMIN")
```

---

## Audit Logging

Sensitive operations are logged.

Examples:

- LOGIN
- CREATE_USER
- CREATE_CAMPAIGN
- DELETE_CAMPAIGN

---

# Tenant Isolation

Tenant isolation is enforced at the API layer using the authenticated user's tenantId.

Example:

```javascript
await prisma.campaign.findMany({
  where: {
    tenantId: req.user.tenantId
  }
});
```

This ensures users cannot access data belonging to another tenant.

---

# Scaling to 1,000 Tenants / 1M Users

## Database Scaling

Add indexes:

```prisma
@@index([tenantId])
@@index([email])
```

Use:

- PostgreSQL Read Replicas
- Connection Pooling
- Query Optimization

---

## Caching

Use Redis for:

- Dashboard Metrics
- Session Validation
- Frequently Accessed Data

---

## Horizontal Scaling

Deploy multiple backend instances behind:

- Nginx
- AWS Load Balancer
- Kubernetes Ingress

---

## Background Processing

Move heavy operations to queues:

- BullMQ
- RabbitMQ
- Kafka

Examples:

- Notifications
- Audit Processing
- Reporting

---

# JWT Revocation Strategy

JWTs are stateless.

Recommended approach:

## Access Token

```text
15 Minutes
```

## Refresh Token

```text
7 Days
```

Store refresh tokens in the database.

On logout:

- Revoke refresh token
- Delete refresh token record

Alternative:

Store blacklisted JWT IDs (jti) in Redis until expiration.

---

# Troubleshooting Production 500 Errors

## Step 1

Check application logs.

```bash
pm2 logs
```

or

```bash
docker logs
```

---

## Step 2

Verify database connectivity.

```bash
npx prisma studio
```

---

## Step 3

Check failing endpoint.

Inspect:

- Request Payload
- Headers
- Response Body

---

## Step 4

Monitor Infrastructure

Check:

- CPU Usage
- Memory Usage
- Response Time
- Database Connections

---

## Step 5

Centralized Logging

Recommended tools:

- Winston
- Morgan
- ELK Stack
- Grafana
- Prometheus

---

## Step 6

Error Monitoring

Use:

- Sentry
- Datadog
- New Relic

to capture stack traces and diagnose production issues quickly.

---

# Future Improvements

- Refresh Token Rotation
- Redis Caching
- Email Notifications
- Real-Time Security Alerts
- Multi-Factor Authentication (MFA)
- SIEM Integration
- Kubernetes Deployment
- CI/CD Pipeline using GitHub Actions
- Automated Testing (Jest + Supertest)

---

# Author

Lokesh Immandi

Full Stack Developer

Tech Stack:
React • TypeScript • Node.js • Express.js • PostgreSQL • Prisma • JWT • RBAC
