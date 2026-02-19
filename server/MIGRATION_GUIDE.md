# Database Migration Guide - Adding Plate Numbers

## What Changed

Added `plateNumber` field to the Route model in the database schema. This allows passengers to identify which bus to board.

## Steps to Update Render Database

### Option 1: Via Render Dashboard (Recommended)

1. Go to your Render dashboard
2. Navigate to your PostgreSQL database
3. Click on "Shell" tab
4. Run the following commands:

```bash
# Navigate to your project directory
cd /opt/render/project/src/server

# Run Prisma migration
npx prisma migrate deploy

# Seed the database with plate numbers
npx prisma db seed
```

### Option 2: Via Server Shell Script

1. SSH into your Render server or use the Shell tab
2. Navigate to the server directory:
```bash
cd /opt/render/project/src/server
```

3. Make the script executable and run it:
```bash
chmod +x migrate-and-seed.sh
./migrate-and-seed.sh
```

### Option 3: Create Migration Manually

If the above doesn't work, you can create the migration manually:

1. In Render Shell, run:
```bash
cd /opt/render/project/src/server
npx prisma migrate dev --name add_plate_number_to_routes
```

2. Then seed:
```bash
npx prisma db seed
```

## What the Migration Does

1. **Adds `plateNumber` field** to the `routes` table (nullable string)
2. **Seeds 6 routes** with plate numbers:
   - RAD 101 V (Virunga Express - Kigali → Musanze)
   - RAD 202 R (Ritco Express - Kigali → Rubavu)
   - RAD 303 W (Volcano Express - Kigali → Huye)
   - RAD 104 V (Virunga Express - Musanze → Kigali)
   - RAD 505 E (Eastern Express - Kigali → Nyagatare)
   - RAD 206 R (Ritco Express - Rubavu → Kigali)

3. **Includes bus images** from Unsplash for each route

## Verification

After running the migration, verify it worked:

```bash
# Check if plateNumber field exists
npx prisma studio

# Or query directly
psql $DATABASE_URL -c "SELECT origin, destination, operator, \"plateNumber\" FROM routes LIMIT 5;"
```

## Troubleshooting

**Error: "Migration failed"**
- Make sure you're in the `/server` directory
- Check that `DATABASE_URL` environment variable is set
- Try running `npx prisma generate` first

**Error: "Seed already ran"**
- The seed script checks if data exists and skips if found
- To force re-seed, delete existing routes first (be careful in production!)

**TypeScript errors in seed file**
- Run `npx prisma generate` to regenerate the Prisma client
- This will update the types to include `plateNumber`

## Files Modified

- `server/prisma/schema.prisma` - Added plateNumber field
- `server/prisma/seed.production.ts` - Added plate numbers to all routes
- `client/GoPass/components/home/ActiveTicketCard.tsx` - Display plate number
- `client/GoPass/components/features/RouteCard.tsx` - Display plate number
- `client/GoPass/types/route.types.ts` - Added plateNumber to type
