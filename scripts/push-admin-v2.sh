#!/bin/bash
set -e

cd "$(dirname "$0")/.."

# Remove stale lock files
rm -f .git/index.lock .git/index.lock.* .git/HEAD.lock*

# Ensure we're on the right branch
git checkout feature/admin-dashboard-v2 2>/dev/null || git checkout -b feature/admin-dashboard-v2

# Apply the patch (skip if already applied)
if git log --oneline -1 | grep -q "admin dashboard with expense tracking"; then
  echo "Commit already exists, skipping patch."
else
  git am admin-dashboard.patch || {
    echo "Patch failed, trying manual add..."
    git am --abort 2>/dev/null
    git add src/pages/AdminDashboard.tsx src/api/client.ts src/App.tsx src/components/AppShell.tsx
    git commit -m "feat: add admin dashboard with expense tracking and real estate value overview

- New AdminDashboard page with 3 tabs: Overview, Expenses, Properties
- Overview: KPIs (portfolio value, equity, income, costs), cashflow highlight,
  LTV bar, 12-month income vs expense bar chart, net cashflow area chart,
  expiring leases alerts
- Expenses: category pie chart breakdown, expense trend chart,
  recent transactions list, cost ratio KPI
- Properties: per-property cards with value, equity, LTV, cashflow,
  yield, appreciation %; horizontal bar chart of value vs loan
- Client-side aggregation via adminDashboard.summary()
- Added /admin route and Dashboard nav item in AppShell bottom nav
- All charts powered by recharts"
  }
fi

# Push to GitHub
git push -u origin feature/admin-dashboard-v2

echo ""
echo "Branch pushed! Create PR at:"
echo "https://github.com/Fisker1/leily/compare/stage...feature/admin-dashboard-v2?expand=1"
