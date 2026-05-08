#!/bin/bash
set -e

cd "$(dirname "$0")/.."

# Remove stale lock file
rm -f .git/index.lock

# Create branch and commit
git checkout -b feature/admin-dashboard-expenses-realestate 2>/dev/null || git checkout feature/admin-dashboard-expenses-realestate

git add src/pages/Oversikt.tsx

git commit -m "feat: Enhanced admin dashboard with expenses tracking and real estate value overview

- Added 3-tab dashboard: Dashboard, Eiendomsverdi, Utgifter
- Portfolio value hero card with equity/debt visualization
- KPI grid: monthly income, expenses, cashflow, yield
- Stacked bar chart (equity vs debt per property)
- Expense breakdown pie chart and cashflow per property bar chart
- Per-property detail cards with LTV ratios and unrealized gains
- Annual projection estimates
- Responsive grid layout (2-col mobile, 4-col desktop)
- Uses Recharts for all data visualizations
- Norwegian language, dark mode support"

# Push to GitHub
git push -u origin feature/admin-dashboard-expenses-realestate

echo ""
echo "Branch pushed! Create PR at:"
echo "https://github.com/Fisker1/leily/compare/feature/admin-dashboard-expenses-realestate"
