We track work in Beads instead of Markdown. Run `bd quickstart` to see how.

# Project Setup

## Cloudflare D1 Database
- **Database Name**: cf-react-router-hono-fullstack-template
- **Local Database**: Located in `.wrangler/state/v3/d1/`
- **Remote Database**: Cloudflare D1 hosted in APAC region

## Development Commands
```bash
# Start development server (uses local D1)
npm run dev

# Type checking
npm run typecheck

# Build and deploy
npm run deploy
```

## Database Operations

### Manual Database Sync
To sync changes between local and remote databases:

```bash
# Export from local
npx wrangler d1 export cf-react-router-hono-fullstack-template --local --output backup.sql

# Import to remote
npx wrangler d1 execute cf-react-router-hono-fullstack-template --remote --file backup.sql

# Or use migrations for structured changes
npx wrangler d1 migrations create migration_name
npx wrangler d1 migrations apply cf-react-router-hono-fullstack-template --remote
```

### Individual Record Management
```bash
# Insert specific record to remote
npx wrangler d1 execute cf-react-router-hono-fullstack-template --command "INSERT INTO users (email, username, ...) VALUES (...);" --remote

# Query remote database
npx wrangler d1 execute cf-react-router-hono-fullstack-template --command "SELECT * FROM users;" --remote
```

## Current Users Table Structure
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME,
    provider TEXT DEFAULT 'email'
);
```

## Important Notes
- React Router projects cannot use `wrangler dev --remote` due to build system incompatibilities
- Use `npm run dev` for development - it connects to local D1 database
- For database changes, use manual SQL commands or proper migrations
- The app includes a `/api/users` endpoint for fetching user data
