# Vercel Deployment Setup

This guide walks through setting up two Vercel projects for staging and production environments.

## Prerequisites

- Vercel account
- GitHub repository connected
- Supabase projects (staging and production)

## 1. Create Vercel Projects

### Staging Project: `leily-staging`

1. **Import from GitHub**
   - Go to Vercel Dashboard
   - Click "New Project"
   - Import your GitHub repository
   - Name: `leily-staging`

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**
   ```
   VITE_ENVIRONMENT=staging
   VITE_SUPABASE_URL=https://wdwjmapvuibsqiifslno.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkd2ptYXB2dWlic3FpaWZzbG5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODU3ODksImV4cCI6MjA3MzI2MTc4OX0.WbEjzF_D8D1g3-i8NA5UIPl-D1ny2W8ZjD2sEp260Cs
   VITE_SUPABASE_PROJECT_ID=wdwjmapvuibsqiifslno
   VITE_APP_URL=https://stage.leily.no
   VITE_COMING_SOON=false
   VITE_ENABLE_ANALYTICS=false
   VITE_DEBUG=true
   ```

4. **Domain Configuration**
   - Add custom domain: `stage.leily.no`
   - Configure DNS CNAME record: `stage.leily.no` → `cname.vercel-dns.com`

5. **Git Integration**
   - Production Branch: `staging`
   - Auto-deploy: Enabled

### Production Project: `leily-production`

1. **Import from GitHub**
   - Import same repository
   - Name: `leily-production`

2. **Configure Build Settings**
   - Same as staging project

3. **Environment Variables**
   ```
   VITE_ENVIRONMENT=production
   VITE_SUPABASE_URL=https://your-production-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-production-anon-key
   VITE_SUPABASE_PROJECT_ID=your-production-project-id
   VITE_APP_URL=https://www.leily.no
   VITE_COMING_SOON=true
   VITE_ENABLE_ANALYTICS=true
   VITE_DEBUG=false
   ```

4. **Domain Configuration**
   - Add custom domain: `www.leily.no`
   - Configure DNS A/AAAA records or CNAME

5. **Git Integration**
   - Production Branch: `main`
   - Auto-deploy: Enabled

## 2. Branch Strategy

### Staging Branch (`staging`)
- Default development branch
- All new features and changes go here first
- Auto-deploys to staging environment
- Used for testing and Loveable integration

### Production Branch (`main`)
- Production-ready code only
- Merge from staging after thorough testing
- Auto-deploys to production environment
- Shows "Coming Soon" page when `VITE_COMING_SOON=true`

## 3. Deployment Workflow

### Development Process
1. **Develop locally**
   ```bash
   # Use staging environment
   cp .env.staging.example .env
   npm run dev
   ```

2. **Push to staging**
   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin staging
   ```

3. **Test in staging**
   - Visit https://stage.leily.no
   - Verify all functionality works
   - Check debug logs in browser console

4. **Deploy to production**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

### Emergency Hotfixes
1. Create hotfix branch from `main`
2. Make minimal fix
3. Merge to both `main` and `staging`
4. Deploy immediately

## 4. Environment Verification

### Staging Checklist
- [ ] Environment detected as "staging"
- [ ] Debug logging enabled
- [ ] Supabase connects to staging database
- [ ] Coming soon page NOT showing
- [ ] Test user login works
- [ ] All features accessible

### Production Checklist
- [ ] Environment detected as "production"
- [ ] Debug logging disabled
- [ ] Supabase connects to production database
- [ ] Coming soon page showing (when enabled)
- [ ] Analytics enabled
- [ ] Performance optimized

## 5. Monitoring & Debugging

### Debug URLs
- Staging: https://stage.leily.no/__env
- Staging: https://stage.leily.no/__health
- Staging: https://stage.leily.no/__supabase

### Vercel Analytics
- Enable in Vercel dashboard
- Monitor performance and usage
- Set up alerts for errors

### Common Issues

**Wrong environment detected:**
- Check `VITE_ENVIRONMENT` variable
- Verify domain patterns in `src/lib/env.ts`

**Supabase connection fails:**
- Verify environment variables are set correctly
- Check Supabase project is active
- Validate URLs and keys

**Build failures:**
- Check TypeScript errors
- Verify all dependencies are installed
- Review build logs in Vercel dashboard

## 6. Security Considerations

### Environment Variables
- Never commit `.env` files
- Use Vercel's environment variable UI
- Rotate keys regularly
- Separate staging and production credentials

### Domain Security
- Use HTTPS only
- Configure proper headers (handled in `vercel.json`)
- Enable Vercel's security features

## 7. Performance Optimization

### Build Optimization
- Code splitting enabled
- Lazy loading for pages
- Optimized bundle sizes
- Image optimization

### Caching Strategy
- Static assets cached by Vercel CDN
- API responses cached when appropriate
- Browser caching for assets

## 8. Maintenance

### Regular Tasks
- [ ] Monitor build times and sizes
- [ ] Update dependencies monthly
- [ ] Review and rotate API keys quarterly
- [ ] Test deployment process monthly
- [ ] Update documentation as needed

### Backup Strategy
- Git repository serves as code backup
- Supabase handles database backups
- Environment variables documented in this file

---

**Need Help?**
- Check Vercel documentation
- Review debug pages (`/__env`, `/__health`, `/__supabase`)
- Consult `DEVELOPER_GUIDE.md` for code issues