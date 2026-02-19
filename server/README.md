# GoPass Backend Server

Node.js + Express + TypeScript backend for the GoPass Mobile Bus E-Ticket Application.

## 📚 Documentation

- **[Database Setup Guide](./DATABASE_SETUP.md)** - Complete local & production database setup
- **[Render Deployment Guide](./RENDER_DEPLOYMENT.md)** - Step-by-step production deployment
- **[Database Switching Guide](./DATABASE_SWITCHING.md)** - How environment-based DB switching works
- **[Database Quick Reference](./DATABASE.md)** - Commands and test credentials

## 🚀 Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT
- **Real-time:** Socket.io (for bus tracking)

## 📁 Project Structure

```
server/
├── src/
│   ├── controllers/     # Request handlers
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, validation, etc.
│   ├── types/           # TypeScript types
│   ├── utils/           # Helper functions
│   └── index.ts         # Entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration history
│   ├── seed.ts          # Database seeding
│   └── verify.ts        # Database verification
├── dist/                # Compiled JavaScript
├── .env                 # Local environment (gitignored)
├── .env.example         # Environment template
└── package.json
```

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/gopass_db"
```

### 3. Set Up Database

```bash
# Create PostgreSQL database
createdb gopass_db

# Run migrations
npm run migrate:deploy

# Seed with test data
npm run db:seed

# Verify setup
npm run db:verify
```

### 4. Run Development Server

```bash
npm run dev
```

Server will start at `http://localhost:5000`

### 5. View Database (Optional)

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

## 🗄️ Database Commands

### Development

```bash
npm run db:push          # Push schema changes (fast, no migrations)
npm run db:migrate       # Create migration (production-ready)
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with test data
npm run db:verify        # Verify database contents
npm run db:reset         # Reset database (delete all, migrate, seed)
```

### Production

```bash
npm run migrate:deploy   # Apply migrations (no new migrations created)
npm start                # Start production server
```

## 🔑 Test Credentials

After seeding, login with:

- **Email:** `test@example.com`
- **Password:** `password123`

Other test accounts: `john.doe@example.com`, `jane.smith@example.com` (same password)

## 📡 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user (protected)

### Routes
- `GET /api/routes` - Get all routes (supports `?origin=&destination=` filters)
- `GET /api/routes/:id` - Get route by ID

### Bookings
- `GET /api/bookings` - Get user's bookings (protected)
- `POST /api/bookings` - Create new booking (protected)
- `GET /api/bookings/:id` - Get booking by ID (protected)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (protected)

### Passes
- `GET /api/passes/templates` - Get available pass templates
- `GET /api/passes` - Get user's passes (protected)
- `POST /api/passes` - Purchase new pass (protected)
- `GET /api/passes/:id` - Get pass by ID (protected)

### Bus Tracking (WebSocket)
- Real-time bus location updates via Socket.io

## 🛠️ Development

### Build for Production

```bash
npm run build
```

### Run Production Build Locally

```bash
npm run build
npm start
```

## 🚀 Deployment

See **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** for complete deployment instructions.

### Quick Deploy to Render

1. Create PostgreSQL database on Render
2. Create Web Service connected to your GitHub repo
3. Set environment variables (see `.env.production`)
4. Deploy!

**Build Command:**
```bash
npm install && npm run build && npx prisma generate
```

**Start Command:**
```bash
npm run migrate:deploy && npm start
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/gopass_db
JWT_SECRET=your-secret-key
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

## 🗃️ Database Schema

### Models
- **User** - User accounts
- **Route** - Bus routes
- **Booking** - Ticket bookings
- **Pass** - Weekly/Monthly passes
- **PassTemplate** - Available pass types
- **Bus** - Bus tracking data

See `prisma/schema.prisma` for complete schema.

## 🔄 Database Switching

The same codebase works with both local and production databases:

**Local:** Reads `DATABASE_URL` from `.env` file
```env
DATABASE_URL="postgresql://localhost:5432/gopass_db"
```

**Production:** Reads `DATABASE_URL` from Render environment variables
```env
DATABASE_URL="postgresql://user:pass@render.com/gopass_db"
```

See **[DATABASE_SWITCHING.md](./DATABASE_SWITCHING.md)** for details.

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

## 📝 Code Style

- **TypeScript** for type safety
- **Clean Architecture** with separation of concerns
- **RESTful API** design
- **JWT** for authentication
- **Prisma** for database access

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Create migrations if schema changed: `npm run db:migrate`
4. Test locally
5. Commit and push
6. Create pull request

## 📄 License

ISC

## 🆘 Support

- Check [DATABASE_SETUP.md](./DATABASE_SETUP.md) for database issues
- Check [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for deployment issues
- Review server logs for errors
- Ensure all environment variables are set correctly
