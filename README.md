# DVerse-AI

A full-stack web application that allows users to analyze and query their Microsoft Dynamics 365/Dataverse instances using natural language powered by Google Gemini AI.

## Features

- 🔐 **User Authentication** - Secure registration and login with JWT tokens
- 🗄️ **Environment Management** - Manage multiple D365/Dataverse environments
- 💬 **AI-Powered Chat** - Ask questions about your Dataverse metadata in natural language
- 📊 **Conversation History** - Track and revisit past conversations
- 🎨 **Modern UI** - Beautiful, responsive design with Microsoft-inspired branding

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom brand design system
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **TypeScript**: Full type safety

### Backend
- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **AI**: Google Gemini 2.0 Flash
- **Authentication**: JWT with Passport
- **External API**: Microsoft Dynamics 365 Web API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google Gemini API key
- Microsoft Dynamics 365 environment with Azure AD app registration

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/dverse_ai
   JWT_SECRET=your-jwt-secret-change-in-production
   GEMINI_API_KEY=your-gemini-api-key
   ENCRYPTION_KEY=your-encryption-key-32-characters
   PORT=3001
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   # Create the database
   createdb dverse_ai
   
   # Run the schema (optional - TypeORM will auto-sync in dev)
   psql dverse_ai < schema.sql
   ```

5. Start the backend:
   ```bash
   npm run start:dev
   ```

   The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will run on `http://localhost:3000`

### Getting Azure AD Credentials

To connect to Dynamics 365, you need to create an Azure AD app registration:

1. Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations
2. Click "New registration"
3. Enter a name and select "Accounts in this organizational directory only"
4. Click "Register"
5. Copy the **Application (client) ID** and **Directory (tenant) ID**
6. Go to "Certificates & secrets" → "New client secret"
7. Create a secret and copy the **Value** (you won't be able to see it again)
8. Go to "API permissions" → "Add a permission"
9. Select "Dynamics CRM" → "Delegated permissions" → "user_impersonation"
10. Grant admin consent

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the API key and add it to your backend `.env` file

## Usage

1. **Register/Login**: Create an account or sign in at `http://localhost:3000/register`

2. **Add Environment**: 
   - Navigate to "Environments" in the sidebar
   - Click "Add Environment"
   - Fill in your D365 credentials
   - Test the connection

3. **Start Chatting**:
   - Go to the main page
   - Select an environment from the dropdown
   - Ask questions about your Dataverse metadata!

Example questions:
- "What entities are in my environment?"
- "Show me all the fields in the Account entity"
- "What relationships does the Contact entity have?"
- "List all custom entities"

## Project Structure

```
dverse-ai/
├── backend/                    # NestJS backend
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── environments/      # Environment management
│   │   ├── conversations/     # Conversation & message handling
│   │   ├── chat/              # Chat orchestration
│   │   ├── dataverse/         # D365 API integration
│   │   ├── gemini/            # Gemini AI integration
│   │   └── common/            # Shared utilities (encryption, etc.)
│   └── schema.sql             # Database schema
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router pages
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── environments/     # Environment management
│   │   └── page.tsx          # Main chat interface
│   ├── components/            # React components
│   │   ├── ui/               # Base UI components
│   │   ├── chat/             # Chat-specific components
│   │   ├── environments/     # Environment components
│   │   └── sidebar.tsx       # Main navigation
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript definitions
│
└── README.md
```

## Design System

### Brand Colors

- **Primary Blue** (`#0078D4`): Main actions, links, branding
- **Cyan** (`#50E6FF`): AI/tech elements, highlights, loading states
- **Orange** (`#FF6B35`): CTAs, important notifications
- **Success Green** (`#10A37F`): Connected status
- **Error Red** (`#EF4444`): Errors, disconnected status

### Typography

- **Font Family**: Inter (sans-serif), JetBrains Mono (monospace)
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get current user
- `POST /auth/logout` - Logout user

### Environments
- `GET /environments` - List all environments
- `POST /environments` - Create environment
- `GET /environments/:id` - Get environment details
- `PATCH /environments/:id` - Update environment
- `DELETE /environments/:id` - Delete environment
- `POST /environments/:id/test` - Test D365 connection

### Conversations
- `GET /conversations` - List all conversations
- `POST /conversations` - Create conversation
- `GET /conversations/:id` - Get conversation with messages
- `DELETE /conversations/:id` - Delete conversation

### Chat
- `POST /chat/message` - Send message and get AI response

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Import the project in Vercel
3. Set the root directory to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=<your-backend-url>`
5. Deploy
6. (Opcional) Configura dominio personalizado y preview deployments según ramas.

### Backend (Railway)

1. Create a new project in Railway
2. Add a PostgreSQL database
3. Add a new service from GitHub
4. Set the root directory to `backend`
5. Add all environment variables from `.env.example`
6. Set `DATABASE_URL` to the Railway PostgreSQL connection string
7. Deploy

## Security Considerations

- ✅ Client secrets are encrypted in the database using AES-256-CBC
- ✅ JWT tokens for authentication
- ✅ HTTPS only in production
- ✅ Input validation on all endpoints
- ✅ SQL injection prevention via TypeORM
- ✅ CORS configured for frontend origin only

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes!

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, NestJS, and Google Gemini AI
