# YardStick SaaS Notes Application

A multi-tenant SaaS Notes Application with role-based access control and subscription management, built with Next.js and deployed on Vercel.

## 🏗️ Architecture Overview

### Multi-Tenancy Approach: Shared Schema with Tenant ID

This application implements the **shared schema with tenant ID** approach for multi-tenancy:

- **Single Database**: All tenants share the same database and tables
- **Tenant Isolation**: Each record includes a `tenantId` column to ensure data isolation
- **Benefits**: 
  - Cost-effective: Single database to maintain
  - Scalable: Easy to add new tenants without infrastructure changes
  - Performance: Optimized queries with proper indexing on `tenantId`
2. **Scalable**: Can handle multiple tenants efficiently
3. **Maintainable**: Single schema to maintain and migrate
4. **Performance**: Better resource utilization compared to database-per-tenant
5. **Simple**: Easier to implement and debug

### Data Isolation Strategy

- **Tenant ID Column**: Every data table includes a `tenantId` field
- **Application-Level Filtering**: All queries are automatically filtered by tenant ID
- **Middleware Protection**: API endpoints enforce tenant isolation
- **Zero Cross-Tenant Access**: Strict validation prevents data leakage

## 🚀 Features

### ✅ Multi-Tenancy
- **Two Tenants**: Acme Corporation and Globex Corporation
- **Complete Isolation**: Zero cross-tenant data access
- **Tenant-Aware APIs**: All endpoints respect tenant boundaries
- **Scalable Architecture**: Easy to add new tenants

### ✅ Authentication & Authorization
- **JWT-Based Authentication**: Secure token-based auth
- **Role-Based Access Control**: Admin and Member roles
- **Protected Routes**: Middleware-enforced permissions
- **Session Management**: Secure login/logout flow

### ✅ Subscription Management
- **Free Plan**: Limited to 3 notes per tenant
- **Pro Plan**: Unlimited notes
- **Instant Upgrades**: Real-time subscription changes
- **Admin-Only Upgrades**: Only admins can upgrade plans

### ✅ Notes CRUD API
- **Create Notes**: POST /api/notes
- **List Notes**: GET /api/notes (tenant-filtered)
- **Get Note**: GET /api/notes/:id
- **Update Note**: PUT /api/notes/:id
- **Delete Note**: DELETE /api/notes/:id

### ✅ Frontend Dashboard
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Instant UI updates
- **Role-Aware UI**: Different features for Admin/Member
- **Subscription Alerts**: Free plan limit notifications

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, JWT Authentication
- **Database**: SQLite (development), PostgreSQL (production)
- **ORM**: Prisma with type-safe queries
- **Deployment**: Vercel-ready configuration
- **Security**: bcryptjs, JWT tokens, CORS enabled

## 📋 Mandatory Test Accounts

All test accounts use password: `password`

### Acme Corporation (FREE Plan)
- **Admin**: `admin@acme.test` - Can invite users and upgrade subscription
- **Member**: `user@acme.test` - Can manage notes only

### Globex Corporation (FREE Plan)
- **Admin**: `admin@globex.test` - Can invite users and upgrade subscription  
- **Member**: `user@globex.test` - Can manage notes only

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd YardStick
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database URL and JWT secret
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Access Application**
   - Frontend: http://localhost:3000
   - Health Check: http://localhost:3000/api/health

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <jwt-token>
```

### Endpoints

#### Health Check
```http
GET /api/health
```
Response:
```json
{ "status": "ok" }
```

#### Authentication
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@acme.test",
  "password": "password"
}
```
Response:
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@acme.test",
    "role": "ADMIN",
    "tenant": {
      "id": "tenant-id",
      "name": "Acme Corporation",
      "slug": "acme",
      "subscriptionPlan": "FREE"
    }
  }
}
```

#### Notes Management
```http
# List all notes (tenant-filtered)
GET /api/notes
Authorization: Bearer <token>

# Create new note
POST /api/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Note Title",
  "content": "Note content here"
}

# Get specific note
GET /api/notes/:id
Authorization: Bearer <token>

# Update note
PUT /api/notes/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content"
}

# Delete note
DELETE /api/notes/:id
Authorization: Bearer <token>
```

#### Subscription Management
```http
# Upgrade tenant to Pro (Admin only)
POST /api/tenants/:slug/upgrade
Authorization: Bearer <admin-token>
```

### Error Responses
```json
{
  "error": "Error message here",
  "code": "ERROR_CODE" // Optional
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `405`: Method Not Allowed
- `500`: Internal Server Error

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Push code to GitHub/GitLab
   - Connect to Vercel

2. **Environment Variables**
   Set these in Vercel dashboard:
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   JWT_SECRET=your-secure-jwt-secret
   JWT_EXPIRES_IN=24h
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

3. **Database Migration**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

4. **Deploy**
   - Automatic deployment on push
   - Zero-config deployment with Vercel

### Production Considerations

- **Database**: Switch to PostgreSQL for production
- **Security**: Use strong JWT secrets
- **Monitoring**: Add error tracking (Sentry)
- **Performance**: Enable database connection pooling
- **Backup**: Implement database backup strategy

## 🧪 Testing

### Manual Testing Checklist

#### ✅ Health Endpoint
- [ ] GET /api/health returns `{"status": "ok"}`

#### ✅ Authentication
- [ ] Login with all 4 test accounts
- [ ] Invalid credentials rejected
- [ ] JWT tokens generated correctly

#### ✅ Tenant Isolation
- [ ] Acme users see only Acme notes
- [ ] Globex users see only Globex notes
- [ ] Cross-tenant access blocked

#### ✅ Role-Based Access
- [ ] Members cannot upgrade subscriptions
- [ ] Admins can upgrade subscriptions
- [ ] All users can manage notes

#### ✅ Subscription Limits
- [ ] Free plan blocks 4th note creation
- [ ] Pro plan allows unlimited notes
- [ ] Upgrade immediately lifts limits

#### ✅ CRUD Operations
- [ ] Create notes successfully
- [ ] List notes (tenant-filtered)
- [ ] Update existing notes
- [ ] Delete notes permanently

### Automated Testing Commands

```bash
# Test health endpoint
curl -X GET http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.test","password":"password"}'

# Test notes API (with token)
curl -X GET http://localhost:3000/api/notes \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🔒 Security Features

### Data Protection
- **Tenant Isolation**: Application-level filtering prevents cross-tenant access
- **SQL Injection**: Prisma ORM prevents SQL injection attacks
- **XSS Protection**: Next.js built-in XSS protection
- **CSRF Protection**: Proper CORS configuration

### Authentication Security
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Configurable expiration times
- **Secure Headers**: Production security headers

### API Security
- **Rate Limiting**: Can be added with middleware
- **Input Validation**: Request validation on all endpoints
- **Error Handling**: No sensitive data in error responses
- **HTTPS**: Production deployment uses HTTPS

## 📊 Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subscriptionPlan TEXT DEFAULT 'FREE',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'MEMBER',
  tenantId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);

-- Notes table
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  userId TEXT NOT NULL,
  tenantId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (tenantId) REFERENCES tenants(id)
);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed description
4. Contact the development team

---

**Built with ❤️ for enterprise-grade multi-tenant applications**