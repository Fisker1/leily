# Leily Development Checklist

This checklist ensures consistent development practices and helps prevent common issues.

## 📋 Before Starting Development

### Environment Setup
- [ ] **Read `README.md`** - Understand project structure and setup
- [ ] **Read `DEVELOPER_GUIDE.md`** - Understand development guidelines
- [ ] **Check `src/lib/env.ts`** - Understand environment configuration
- [ ] **Copy environment file**: `cp .env.staging.example .env`
- [ ] **Install dependencies**: `npm install`
- [ ] **Start dev server**: `npm run dev`
- [ ] **Test debug pages**: Visit `/__env`, `/__health`, `/__supabase`

### Verify Current State
- [ ] **Environment detected correctly** - Check browser console
- [ ] **Supabase connection works** - Check `/__supabase`
- [ ] **TypeScript compiles** - Run `npm run build`
- [ ] **No linter errors in files you'll modify** - Run `npm run lint`

## 🔧 During Development

### Code Quality Standards
- [ ] **Use TypeScript strictly** - No `any` types
- [ ] **Follow existing patterns** - Check similar components/pages
- [ ] **Use environment config** - Import from `src/lib/env.ts`
- [ ] **Handle errors gracefully** - Add try/catch where needed
- [ ] **Add proper interfaces** - Define types for props and data

### Testing Each Change
- [ ] **TypeScript compiles** - `npm run build`
- [ ] **Page loads without errors** - Check browser console
- [ ] **Responsive design** - Test mobile and desktop
- [ ] **Environment detection** - Works in staging and production
- [ ] **Debug information** - Check `/__env` page

### Git Practices
- [ ] **Descriptive commit messages** - Use conventional commits
- [ ] **Small, focused commits** - One feature/fix per commit
- [ ] **Test before committing** - Ensure code works
- [ ] **Push to staging first** - Never directly to main

## 🚀 Before Deployment

### Pre-Deployment Checklist
- [ ] **All tests pass** - `npm run build` succeeds
- [ ] **No TypeScript errors** - Build completes cleanly
- [ ] **Environment variables set** - Check Vercel project settings
- [ ] **Database migrations applied** - If schema changed
- [ ] **Dependencies updated** - If package.json changed

### Staging Deployment
- [ ] **Push to staging branch** - `git push origin staging`
- [ ] **Wait for Vercel deploy** - Check deployment status
- [ ] **Test on staging URL** - https://stage.leily.no
- [ ] **Verify environment** - Should show "staging"
- [ ] **Test all affected features** - Manual testing
- [ ] **Check browser console** - No errors
- [ ] **Test on mobile** - Responsive design works

### Production Deployment
- [ ] **Staging thoroughly tested** - All features work
- [ ] **Merge to main branch** - `git checkout main && git merge staging`
- [ ] **Push to production** - `git push origin main`
- [ ] **Wait for Vercel deploy** - Check deployment status
- [ ] **Verify coming soon page** - If enabled
- [ ] **Test critical paths** - Authentication, key features
- [ ] **Monitor for errors** - Check Vercel analytics

## 🔍 Troubleshooting Checklist

### Build Failures
- [ ] **Check TypeScript errors** - Fix all type issues
- [ ] **Verify imports** - All imports resolve correctly
- [ ] **Check dependencies** - All required packages installed
- [ ] **Review recent changes** - What changed since last working build

### Runtime Errors
- [ ] **Check browser console** - Look for JavaScript errors
- [ ] **Verify environment variables** - Check `/__env` page
- [ ] **Test Supabase connection** - Check `/__supabase` page
- [ ] **Check network tab** - Look for failed API calls
- [ ] **Verify user permissions** - Authentication and authorization

### Environment Issues
- [ ] **Environment detected correctly** - Check `src/lib/env.ts` logic
- [ ] **Environment variables set** - Verify in Vercel dashboard
- [ ] **URL patterns match** - Check domain detection logic
- [ ] **Database connection** - Verify Supabase credentials

### Performance Issues
- [ ] **Bundle size** - Check build output for large chunks
- [ ] **Lazy loading** - Ensure pages are lazy loaded
- [ ] **Image optimization** - Use optimized formats
- [ ] **Network requests** - Minimize API calls

## 📚 Common Tasks Quick Reference

### Adding New Environment Variable
1. Add to `src/lib/env.ts`
2. Update `.env.staging.example` and `.env.production.example`
3. Set in Vercel project settings
4. Test in both environments

### Adding New Page
1. Create in `src/pages/`
2. Add lazy import in `src/App.tsx`
3. Add route in Routes component
4. Test navigation works

### Modifying Supabase Schema
1. Create migration file
2. Test in staging database first
3. Update TypeScript types
4. Update affected components

### Fixing TypeScript Errors
1. Never use `any` type
2. Create proper interfaces
3. Import types from correct files
4. Use type guards for runtime checks

## 🆘 Emergency Procedures

### Staging Is Broken
1. Check recent commits: `git log --oneline -10`
2. Revert problematic commit: `git revert <commit-hash>`
3. Push fix: `git push origin staging`
4. Verify fix deployed

### Production Is Down
1. **DO NOT PANIC** - Follow procedure
2. Check Vercel dashboard for deployment status
3. If deployment issue: Revert to last working commit
4. If runtime issue: Check environment variables
5. If database issue: Check Supabase dashboard
6. Fix in staging first, then deploy to production

### Lost Work
1. Check git history: `git log --graph --oneline`
2. Check local branches: `git branch -a`
3. Check Vercel deployments for recent code
4. Use `git reflog` to find lost commits

## ✅ Definition of Done

A task is complete when:
- [ ] **Code works** - Functionality implemented correctly
- [ ] **Tests pass** - Build succeeds, no TypeScript errors
- [ ] **Documentation updated** - If needed
- [ ] **Staging tested** - Works in staging environment
- [ ] **Code reviewed** - Follows project standards
- [ ] **Production ready** - Can be deployed safely

## 🎯 Quality Gates

### Before Committing
- TypeScript compiles without errors
- No console errors in development
- Code follows project patterns
- Changes are minimal and focused

### Before Staging Deploy
- Build succeeds completely
- All affected features tested
- Environment variables correct
- Database migrations applied

### Before Production Deploy
- Staging thoroughly tested
- Performance is acceptable
- Error handling is robust
- Monitoring is in place

---

**Remember**: When in doubt, check `src/lib/env.ts` first, test in staging, and ask for help if needed!