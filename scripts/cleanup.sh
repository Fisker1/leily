#!/bin/bash
# Leily cleanup script — removes unused features and files
# Run from the leily project root: bash scripts/cleanup.sh

set -e

echo "🧹 Cleaning up unused files..."

# Remove unused feature directories
rm -rf src/features/ai
rm -rf src/features/marketing
rm -rf src/features/credits
rm -rf src/features/admin
rm -rf src/features/legal

# Remove unused calculator components (keep SimpleLoanCalculator, LoanCalculator, YieldCalculators)
rm -f src/features/calculator/components/BoligkalkyleSimulator.tsx
rm -f src/features/calculator/components/BuildingPlannerImproved.tsx
rm -f src/features/calculator/components/CalculatorChat.tsx
rm -f src/features/calculator/components/ResizableSplitView.tsx
rm -f src/features/calculator/components/FinnPropertyDisplay.tsx
rm -f src/features/calculator/components/ExternalLenderDialog.tsx
rm -f src/features/calculator/components/ExtendedDetailsDialog.tsx
rm -f src/features/calculator/components/CalculationLibrary.tsx
rm -f src/features/calculator/components/CalculatorPDFPreview.tsx
rm -f src/features/calculator/components/PropertyValueFetcher.tsx
rm -f src/features/calculator/components/RiskEvaluation.tsx
rm -f src/features/calculator/components/MarketAnalysis.tsx
rm -f src/features/calculator/components/AdvancedCalculations.tsx

# Remove unused calculator pages/types/utils
rm -f src/features/calculator/pages/RiskAnalysis.tsx
rm -f src/features/calculator/pages/ExtendedPropertyDetails.tsx
rm -f src/features/calculator/pages/BankReport.tsx
rm -rf src/features/calculator/types
rm -rf src/features/calculator/utils

# Remove unused calculator hooks
rm -f src/features/calculator/hooks/useBuildingProjects.tsx
rm -f src/features/calculator/hooks/useExternalLenderSettings.tsx
rm -f src/features/calculator/hooks/useCalculationHistory.tsx
rm -f src/features/calculator/hooks/useCalculatorData.tsx

# Remove unused property components
rm -f src/features/property/components/PropertyValuationAPI.tsx
rm -f src/features/property/components/ElectricityEstimator.tsx
rm -f src/features/property/components/PropertyProfitabilityChart.tsx

# Remove unused rental components
rm -f src/features/rental/components/RentalMap.tsx
rm -f src/features/rental/components/MarketAnalysisDialog.tsx

# Remove old pages (now replaced by src/pages/)
rm -f src/features/rental/pages/Rental.tsx
rm -f src/features/rental/pages/Portfolio.tsx
rm -f src/features/dashboard/pages/Dashboard.tsx
rm -f src/features/profile/pages/MyProfile.tsx
rm -rf src/features/dashboard/components

# Remove unused shared files
rm -rf src/shared/components/security
rm -f src/shared/hooks/useSecurityMonitoring.tsx
rm -f src/shared/hooks/useRateLimit.tsx
rm -f src/shared/hooks/useCredits.tsx
rm -f src/shared/hooks/useUserAmbassador.tsx
rm -f src/shared/hooks/useSubscription.tsx
rm -f src/shared/hooks/useEmailService.tsx
rm -f src/shared/components/FeedbackDialog.tsx
rm -f src/shared/components/LanguageToggle.tsx
rm -f src/shared/components/MinimalFooter.tsx
rm -f src/shared/components/ThemeToggle.tsx
rm -f src/shared/components/Navigation.tsx
rm -f src/shared/components/NotFound.tsx
rm -rf src/shared/config
rm -f src/shared/lib/tenantSecurity.ts

# Remove LanguageContext (app is now Norwegian-only)
rm -f src/contexts/LanguageContext.tsx

# Remove temp files
rm -f vite.config.ts.timestamp*
rm -f Dockerfile.bak

echo "✅ Cleanup complete!"
echo ""
echo "Now run:"
echo "  git add -A"
echo "  git commit -m 'refactor: mobile-first Norwegian UI with 4 core screens'"
echo "  git push origin refactor/mobile-first-norwegian"
