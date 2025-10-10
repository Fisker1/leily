# Leily - Real Estate Platform

A modern, lightweight real estate platform built with React, TypeScript, and Supabase.

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: Vercel (staging + production)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (install with [nvm](https://github.com/nvm-sh/nvm))
- Git

### Local Development
```bash
# Clone repository
git clone <repository-url>
cd leily

# Install dependencies
npm install

# Copy environment file and configure
cp .env.staging.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

Visit http://localhost:8080

## 🌍 Environments

### Staging
- **URL**: https://stage.leily.no
- **Purpose**: Development and testing
- **Supabase**: wdwjmapvuibsqiifslno.supabase.co
- **Features**: Debug logging, test data, relaxed security

### Production
- **URL**: https://www.leily.no
- **Purpose**: Live application
- **Features**: Coming soon page, analytics, optimized performance

## 📧 Email Service

The application uses **Microsoft Graph API** for email delivery with the following features:
- Account creation confirmations
- Password reset emails
- Lease agreement notifications
- Payment reminders

**Architecture:**
- **Supabase Edge Functions**: `send-leily-email` handles email sending
- **Microsoft Graph API**: Primary email delivery method
- **Templating System**: HTML templates with dynamic content replacement
- **Authentication**: OAuth2 Client Credentials flow

**Configuration:**
- `MICROSOFT_CLIENT_ID` - Azure App Registration Client ID
- `MICROSOFT_CLIENT_SECRET` - Azure App Registration Client Secret
- `MICROSOFT_TENANT_ID` - Azure Tenant ID
- `MICROSOFT_EMAIL_USER` - Sender email address (anderslundoy@leily.no)

**Email Templates:**
- Templates are embedded in `supabase/functions/send-leily-email/utils/renderTemplate.ts`
- Supports placeholders: `{{name}}`, `{{email}}`, `{{reset_link}}`, etc.
- Professional HTML design compatible with Outlook and Gmail

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route components
├── lib/                # Core utilities and configuration
│   └── env.ts         # Environment configuration (MAIN CONFIG)
├── integrations/       # External service integrations
│   └── supabase/      # Database client and types
├── contexts/          # React contexts (auth, language)
├── hooks/             # Custom React hooks
└── utils/             # Helper functions
```

## ⚙️ Configuration

### Environment Variables

**Required for all environments:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

**Optional:**
- `VITE_ENVIRONMENT` - Environment name (staging/production)
- `VITE_APP_URL` - Base application URL
- `VITE_COMING_SOON` - Show coming soon page (true/false)
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)
- `VITE_DEBUG` - Enable debug logging (true/false)

### Key Files
- `src/lib/env.ts` - **MAIN CONFIGURATION FILE** - All environment logic
- `src/config/environments.ts` - Environment-specific settings
- `src/integrations/supabase/client.ts` - Database connection

## 🔧 Development Guidelines

### For AI Code Editors

1. **Always check `src/lib/env.ts` first** - This contains all environment logic
2. **Use existing components** - Check `src/components/` before creating new ones
3. **Follow TypeScript strictly** - No `any` types, use proper interfaces
4. **Test in staging first** - Never deploy directly to production

### Common Tasks

**Add new environment variable:**
1. Add to `src/lib/env.ts`
2. Update `.env.staging.example` and `.env.production.example`
3. Update Vercel project settings

**Add new page:**
1. Create in `src/pages/`
2. Add route to `src/App.tsx`
3. Add lazy import for performance

**Modify Supabase schema:**
1. Create migration in `supabase/migrations/`
2. Update types in `src/integrations/supabase/types.ts`
3. Test in staging environment first

## 🚦 Deployment

### Vercel Setup

**Staging Project** (`leily-staging`):
```bash
# Environment Variables
VITE_ENVIRONMENT=staging
VITE_SUPABASE_URL=https://wdwjmapvuibsqiifslno.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkd2ptYXB2dWlic3FpaWZzbG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODU3ODksImV4cCI6MjA3MzI2MTc4OX0.WbEjzF_D8D1g3-i8NA5UIPl-D1ny2W8ZjD2sEp260Cs
VITE_SUPABASE_PROJECT_ID=wdwjmapvuibsqiifslno
VITE_APP_URL=https://stage.leily.no
VITE_COMING_SOON=false
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG=true
```

**Production Project** (`leily-production`):
```bash
# Environment Variables
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_SUPABASE_PROJECT_ID=your-production-project-id
VITE_APP_URL=https://www.leily.no
VITE_COMING_SOON=true
VITE_ENABLE_ANALYTICS=true
VITE_DEBUG=false
```

### Deploy Process
1. Push to Git repository
2. Vercel automatically deploys:
   - `main` branch → Production
   - `staging` branch → Staging
3. Test in staging before merging to main

## 🧪 Testing

### Manual Testing Checklist
- [ ] Environment detection works correctly
- [ ] Supabase connection established
- [ ] Authentication flow works
- [ ] Coming soon page shows in production
- [ ] Debug logging works in staging
- [ ] All pages load without errors

### Debug Pages
- `/__env` - Environment configuration
- `/__health` - Application health check
- `/__supabase` - Supabase connection status

## 🔍 Troubleshooting

### Common Issues

**"Missing Supabase configuration" error:**
- Check environment variables are set correctly
- Verify `.env` file exists and has correct values

**Wrong environment detected:**
- Check `VITE_ENVIRONMENT` variable
- Environment is auto-detected from URL if not set

**Coming soon page not showing:**
- Must be in production environment
- `VITE_COMING_SOON` must be "true"

**Supabase connection fails:**
- Verify URL and anon key are correct
- Check network connectivity
- Ensure project exists and is active

## 📞 Support

For development questions or issues, check:
1. This README file
2. Debug pages (`/__env`, `/__health`, `/__supabase`)
3. Browser console for error messages
4. Supabase dashboard for database issues

---

**Built with ❤️ for the Norwegian real estate market**