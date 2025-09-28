# Developer Guide for AI Code Editors

This guide ensures AI code editors can work effectively with the Leily codebase.

## 🎯 Before Making Any Changes

### 1. Understand the Environment System
```bash
# ALWAYS check this file first - it contains ALL environment logic
src/lib/env.ts
```

The environment system automatically detects:
- `development` - localhost, 127.0.0.1
- `staging` - URLs containing "stage" or "staging"
- `production` - everything else

### 2. Key Configuration Files (Read These First)
```bash
src/lib/env.ts                    # MAIN CONFIG - Environment detection & variables
src/config/environments.ts       # Environment-specific settings
src/integrations/supabase/client.ts  # Database connection
src/App.tsx                      # Main app logic & routing
```

### 3. Environment Variables Reference
```bash
# Required
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=project-id

# Optional
VITE_ENVIRONMENT=staging|production
VITE_APP_URL=https://your-domain.com
VITE_COMING_SOON=true|false
VITE_ENABLE_ANALYTICS=true|false
VITE_DEBUG=true|false
```

## ✅ Pre-Edit Checklist

Before making any code changes, verify:

- [ ] **Environment system understood** - Check `src/lib/env.ts`
- [ ] **Current environment** - Is this staging or production?
- [ ] **Supabase connection** - Are credentials correct?
- [ ] **Dependencies** - Are all required packages installed?
- [ ] **TypeScript** - Does the code compile without errors?

## 🚨 Critical Rules

### DO NOT:
- ❌ Hardcode environment values
- ❌ Use `any` types in TypeScript
- ❌ Create new environment files without updating examples
- ❌ Deploy to production without testing in staging
- ❌ Modify Supabase client without understanding implications
- ❌ Add new dependencies without justification

### ALWAYS:
- ✅ Use `src/lib/env.ts` for environment detection
- ✅ Test changes in staging first
- ✅ Follow existing code patterns
- ✅ Use TypeScript strictly
- ✅ Check debug pages after changes (`/__env`, `/__health`)

## 🔧 Common Tasks

### Adding New Environment Variable

1. **Add to `src/lib/env.ts`:**
```typescript
export const APP_CONFIG = {
  // ... existing config
  newFeature: import.meta.env.VITE_NEW_FEATURE === 'true'
};
```

2. **Update example files:**
```bash
.env.staging.example
.env.production.example
```

3. **Update Vercel project settings** (manual step)

### Adding New Page

1. **Create page component:**
```bash
src/pages/NewPage.tsx
```

2. **Add lazy import in `src/App.tsx`:**
```typescript
const NewPage = lazy(() => import("./pages/NewPage"));
```

3. **Add route:**
```typescript
<Route path="/new-page" element={<NewPage />} />
```

### Modifying Supabase Schema

1. **Create migration:**
```bash
supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

2. **Update types:**
```bash
src/integrations/supabase/types.ts
```

3. **Test in staging environment first**

### Adding New Component

1. **Check if similar component exists:**
```bash
src/components/
```

2. **Follow shadcn/ui patterns if UI component**

3. **Use TypeScript interfaces:**
```typescript
interface ComponentProps {
  title: string;
  onAction: () => void;
}
```

## 🧪 Testing Your Changes

### 1. Local Development
```bash
npm run dev
# Check http://localhost:8080
```

### 2. Debug Pages
- `http://localhost:8080/__env` - Environment config
- `http://localhost:8080/__health` - Health check
- `http://localhost:8080/__supabase` - Database status

### 3. Console Checks
```javascript
// In browser console
console.log('Environment:', import.meta.env.VITE_ENVIRONMENT);
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

### 4. Build Test
```bash
npm run build
# Should complete without errors
```

## 🚀 Deployment Workflow

### Staging Deployment
1. Push to `staging` branch
2. Vercel auto-deploys to staging
3. Test at https://stage.leily.no
4. Verify debug logs work

### Production Deployment
1. Merge to `main` branch
2. Vercel auto-deploys to production
3. Verify coming soon page shows
4. Check analytics work

## 🔍 Debugging Issues

### Environment Not Detected Correctly
```typescript
// Check src/lib/env.ts - getEnvironment() function
// Verify URL patterns match your domain
```

### Supabase Connection Fails
```typescript
// Check src/integrations/supabase/client.ts
// Verify SUPABASE_CONFIG values
// Check network tab in browser dev tools
```

### Coming Soon Page Not Showing
```typescript
// Must be production environment AND VITE_COMING_SOON=true
// Check src/App.tsx - SHOULD_SHOW_COMING_SOON logic
```

### TypeScript Errors
```bash
# Check for missing types
npm run build

# Common fixes:
# - Add proper interfaces
# - Import missing types
# - Check src/integrations/supabase/types.ts
```

## 📋 Code Quality Standards

### TypeScript
- Use strict mode
- Define interfaces for all props
- No `any` types
- Proper error handling

### React
- Use functional components
- Proper dependency arrays in useEffect
- Lazy load pages for performance
- Use React.memo for expensive components

### Styling
- Use Tailwind CSS classes
- Follow shadcn/ui patterns
- Responsive design (mobile-first)
- Consistent spacing and colors

### Performance
- Lazy load pages
- Optimize images
- Minimal bundle size
- Efficient re-renders

## 🆘 Emergency Procedures

### Staging Broken
1. Check recent commits
2. Revert problematic changes
3. Verify environment variables
4. Check Supabase connection

### Production Issues
1. **DO NOT** deploy fixes directly
2. Fix in staging first
3. Test thoroughly
4. Then deploy to production

### Database Issues
1. Check Supabase dashboard
2. Verify migrations applied
3. Check connection strings
4. Review recent schema changes

---

## 📞 Quick Reference

**Key Files:**
- `src/lib/env.ts` - Environment system
- `src/App.tsx` - Main app logic
- `src/integrations/supabase/client.ts` - Database

**Debug URLs:**
- `/__env` - Environment info
- `/__health` - Health check
- `/__supabase` - Database status

**Environment Detection:**
- localhost → development
- stage.* → staging
- everything else → production

**Remember: When in doubt, check `src/lib/env.ts` first!**