# Environment Variables Setup Guide

## Backend (.env)

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dverse_ai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key-from-google-ai-studio

# Encryption (must be at least 32 characters)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### How to Get Each Value:

#### DATABASE_URL
- Install PostgreSQL locally or use a cloud provider
- Create a database: `createdb dverse_ai`
- Format: `postgresql://username:password@host:port/database`
- Example: `postgresql://postgres:password@localhost:5432/dverse_ai`

#### JWT_SECRET
- Generate a random string (minimum 32 characters)
- Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Or use any password generator

#### GEMINI_API_KEY
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste it in your .env file

#### ENCRYPTION_KEY
- Must be exactly 32 characters or more
- Generate: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
- Or create your own 32+ character string

#### PORT
- Default: 3001
- Change if you need a different port

#### NODE_ENV
- `development` for local development
- `production` for deployed environments

---

## Frontend (.env.local)

Create a `.env.local` file in the `frontend` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### How to Get Each Value:

#### NEXT_PUBLIC_API_URL
- For local development: `http://localhost:3001`
- For production: Your deployed backend URL (e.g., `https://your-backend.railway.app`)

---

## Production Deployment

### Vercel (Frontend)

Add these environment variables in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### Railway (Backend)

Add these environment variables in Railway dashboard:

```
DATABASE_URL=<automatically provided by Railway PostgreSQL>
JWT_SECRET=<generate a new one for production>
GEMINI_API_KEY=<your gemini api key>
ENCRYPTION_KEY=<generate a new one for production>
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Security Best Practices

1. **Never commit .env files to Git** - They're in .gitignore
2. **Use different secrets for production** - Don't reuse development keys
3. **Rotate secrets periodically** - Especially JWT_SECRET and ENCRYPTION_KEY
4. **Use strong, random values** - Don't use predictable strings
5. **Keep API keys secure** - Don't share them or expose them in client-side code

---

## Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify all required variables are set

### Frontend can't connect to backend
- Check NEXT_PUBLIC_API_URL is correct
- Ensure backend is running on the specified port
- Verify CORS is configured correctly

### Authentication fails
- Check JWT_SECRET is set and consistent
- Ensure ENCRYPTION_KEY is at least 32 characters
- Verify database connection is working

### Gemini API errors
- Verify GEMINI_API_KEY is valid
- Check you have API quota remaining
- Ensure you're using the correct model name

---

## Quick Setup Commands

```bash
# Generate JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate Encryption Key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Create PostgreSQL Database
createdb dverse_ai

# Test PostgreSQL Connection
psql dverse_ai -c "SELECT version();"
```

---

## Example .env Files

### Backend .env (Development)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/dverse_ai
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
GEMINI_API_KEY=AIzaSyD_your_actual_api_key_here
ENCRYPTION_KEY=32characterencryptionkeyhere12
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend .env.local (Development)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Need Help?

- Backend won't compile: Check all dependencies are installed (`npm install`)
- Frontend build errors: Clear `.next` folder and rebuild
- Database errors: Verify PostgreSQL is running and credentials are correct
- API connection issues: Check firewall and CORS settings
