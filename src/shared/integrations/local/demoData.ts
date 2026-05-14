// ─── Demo Data for Admin Finance Dashboard ──────────────────────────────
// Realistic Norwegian real estate portfolio data for local development

const now = new Date();
const monthsAgo = (m: number) => {
  const d = new Date(now);
  d.setMonth(d.getMonth() - m);
  return d.toISOString();
};
const daysAgo = (d: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  return date.toISOString();
};

// ─── Properties ──────────────────────────────────────────────────────────
export const demoProperties = [
  {
    id: 'prop-1',
    user_id: 'local-user',
    address: 'Bygdøy allé 12B',
    city: 'Oslo',
    postal_code: '0262',
    property_type: 'Leilighet',
    current_value: 6800000,
    purchase_price: 5200000,
    purchase_date: '2019-06-15',
    monthly_rent: 22000,
    loan_amount: 4160000,
    interest_rate: 4.85,
    loan_duration_years: 25,
    size_sqm: 72,
    bedrooms: 2,
    primary_residence: false,
    image_url: null,
    created_at: '2019-06-15T10:00:00Z',
  },
  {
    id: 'prop-2',
    user_id: 'local-user',
    address: 'Kirkegata 5',
    city: 'Drammen',
    postal_code: '3015',
    property_type: 'Leilighet',
    current_value: 3950000,
    purchase_price: 3400000,
    purchase_date: '2021-03-01',
    monthly_rent: 14500,
    loan_amount: 2720000,
    interest_rate: 5.10,
    loan_duration_years: 25,
    size_sqm: 55,
    bedrooms: 2,
    primary_residence: false,
    image_url: null,
    created_at: '2021-03-01T10:00:00Z',
  },
  {
    id: 'prop-3',
    user_id: 'local-user',
    address: 'Solsiden 8A',
    city: 'Trondheim',
    postal_code: '7014',
    property_type: 'Rekkehus',
    current_value: 5200000,
    purchase_price: 4600000,
    purchase_date: '2022-09-20',
    monthly_rent: 18000,
    loan_amount: 3680000,
    interest_rate: 4.95,
    loan_duration_years: 30,
    size_sqm: 95,
    bedrooms: 3,
    primary_residence: false,
    image_url: null,
    created_at: '2022-09-20T10:00:00Z',
  },
  {
    id: 'prop-4',
    user_id: 'local-user',
    address: 'Strandveien 44',
    city: 'Bergen',
    postal_code: '5004',
    property_type: 'Leilighet',
    current_value: 4300000,
    purchase_price: 3800000,
    purchase_date: '2020-11-10',
    monthly_rent: 15500,
    loan_amount: 3040000,
    interest_rate: 5.05,
    loan_duration_years: 25,
    size_sqm: 62,
    bedrooms: 2,
    primary_residence: false,
    image_url: null,
    created_at: '2020-11-10T10:00:00Z',
  },
  {
    id: 'prop-5',
    user_id: 'local-user',
    address: 'Frognerveien 28',
    city: 'Oslo',
    postal_code: '0263',
    property_type: 'Enebolig',
    current_value: 12500000,
    purchase_price: 9800000,
    purchase_date: '2018-04-01',
    monthly_rent: 0,
    loan_amount: 6860000,
    interest_rate: 4.65,
    loan_duration_years: 30,
    size_sqm: 185,
    bedrooms: 4,
    primary_residence: true,
    image_url: null,
    created_at: '2018-04-01T10:00:00Z',
  },
];

// ─── Valuations ──────────────────────────────────────────────────────────
const generateValuations = () => {
  const valuations: Array<{
    id: string;
    property_id: string;
    valuation_amount: number;
    valuation_date: string;
    valuation_type: string;
    source: string;
  }> = [];

  demoProperties.forEach((prop) => {
    const purchaseDate = new Date(prop.purchase_date!);
    const appreciation = (prop.current_value! - prop.purchase_price!) / prop.purchase_price!;
    const monthsSincePurchase = Math.round(
      (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const monthlyGrowth = appreciation / monthsSincePurchase;

    // Generate quarterly valuations
    for (let i = 0; i <= Math.min(monthsSincePurchase, 24); i += 3) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - (Math.min(monthsSincePurchase, 24) - i));
      const growthFactor = 1 + monthlyGrowth * (Math.min(monthsSincePurchase, 24) - (Math.min(monthsSincePurchase, 24) - i));
      const value = Math.round(prop.purchase_price! * Math.max(growthFactor, 0.95));

      valuations.push({
        id: `val-${prop.id}-${i}`,
        property_id: prop.id,
        valuation_amount: value,
        valuation_date: date.toISOString().substring(0, 10),
        valuation_type: 'estimate',
        source: i % 6 === 0 ? 'Eiendomsmegler' : 'Markedsanalyse',
      });
    }
  });

  return valuations;
};

export const demoValuations = generateValuations();

// ─── Lease Agreements ────────────────────────────────────────────────────
export const demoLeases = [
  {
    id: 'lease-1',
    property_id: 'prop-1',
    tenant_name: 'Erik Hansen',
    monthly_rent: 22000,
    deposit_amount: 66000,
    start_date: '2024-01-01',
    end_date: '2026-12-31',
    status: 'active',
  },
  {
    id: 'lease-2',
    property_id: 'prop-2',
    tenant_name: 'Maria Olsen',
    monthly_rent: 14500,
    deposit_amount: 43500,
    start_date: '2023-08-01',
    end_date: '2025-07-31',
    status: 'active',
  },
  {
    id: 'lease-3',
    property_id: 'prop-3',
    tenant_name: 'Thomas Berg',
    monthly_rent: 18000,
    deposit_amount: 54000,
    start_date: '2024-06-01',
    end_date: null,
    status: 'active',
  },
  {
    id: 'lease-4',
    property_id: 'prop-4',
    tenant_name: 'Ingrid Larsen',
    monthly_rent: 15500,
    deposit_amount: 46500,
    start_date: '2024-03-01',
    end_date: '2026-02-28',
    status: 'active',
  },
  {
    id: 'lease-1-old',
    property_id: 'prop-1',
    tenant_name: 'Lars Johansen',
    monthly_rent: 19500,
    deposit_amount: 58500,
    start_date: '2022-01-01',
    end_date: '2023-12-31',
    status: 'expired',
  },
];

// ─── Payment Records (Expenses) ──────────────────────────────────────────
const expenseCategories = [
  { type: 'Vedlikehold', methods: ['Faktura', 'Kort'], range: [2000, 35000] },
  { type: 'Forsikring', methods: ['Autotrekk'], range: [1800, 4500] },
  { type: 'Kommunale avgifter', methods: ['Autotrekk', 'Faktura'], range: [3000, 8000] },
  { type: 'Strøm', methods: ['Autotrekk'], range: [1200, 5500] },
  { type: 'Internett', methods: ['Autotrekk'], range: [499, 899] },
  { type: 'Eiendomsskatt', methods: ['Faktura'], range: [2500, 6000] },
  { type: 'Renhold', methods: ['Faktura', 'Vipps'], range: [1500, 4000] },
  { type: 'Oppussing', methods: ['Faktura', 'Kort'], range: [15000, 120000] },
  { type: 'Juridisk', methods: ['Faktura'], range: [5000, 25000] },
  { type: 'Takstvurdering', methods: ['Faktura'], range: [3000, 8000] },
];

const generatePayments = () => {
  const payments: Array<{
    id: string;
    user_id: string;
    amount: number;
    payment_type: string;
    payment_status: string;
    payment_method: string;
    created_at: string;
    currency: string;
    description: string;
    property_id: string | null;
  }> = [];

  // Seed for deterministic but realistic data
  let seed = 42;
  const pseudoRandom = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  // Generate 18 months of expenses
  for (let month = 0; month < 18; month++) {
    // Monthly recurring expenses for each property
    demoProperties.forEach((prop) => {
      // Insurance (quarterly)
      if (month % 3 === 0) {
        const cat = expenseCategories[1]; // Forsikring
        payments.push({
          id: `pay-ins-${prop.id}-${month}`,
          user_id: 'local-user',
          amount: Math.round(cat.range[0] + pseudoRandom() * (cat.range[1] - cat.range[0])),
          payment_type: cat.type,
          payment_status: 'completed',
          payment_method: cat.methods[0],
          created_at: monthsAgo(month),
          currency: 'NOK',
          description: `Forsikring - ${prop.address}`,
          property_id: prop.id,
        });
      }

      // Kommunale avgifter (quarterly)
      if (month % 3 === 1) {
        const cat = expenseCategories[2];
        payments.push({
          id: `pay-ka-${prop.id}-${month}`,
          user_id: 'local-user',
          amount: Math.round(cat.range[0] + pseudoRandom() * (cat.range[1] - cat.range[0])),
          payment_type: cat.type,
          payment_status: 'completed',
          payment_method: cat.methods[Math.floor(pseudoRandom() * cat.methods.length)],
          created_at: monthsAgo(month),
          currency: 'NOK',
          description: `Kommunale avgifter - ${prop.address}`,
          property_id: prop.id,
        });
      }

      // Electricity (monthly for non-rented or primary)
      if (prop.primary_residence || pseudoRandom() > 0.6) {
        const cat = expenseCategories[3]; // Strøm
        payments.push({
          id: `pay-el-${prop.id}-${month}`,
          user_id: 'local-user',
          amount: Math.round(cat.range[0] + pseudoRandom() * (cat.range[1] - cat.range[0])),
          payment_type: cat.type,
          payment_status: 'completed',
          payment_method: cat.methods[0],
          created_at: monthsAgo(month),
          currency: 'NOK',
          description: `Strøm - ${prop.address}`,
          property_id: prop.id,
        });
      }
    });

    // Random maintenance/repairs (2-4 per month across portfolio)
    const maintenanceCount = 2 + Math.floor(pseudoRandom() * 3);
    for (let j = 0; j < maintenanceCount; j++) {
      const propIndex = Math.floor(pseudoRandom() * demoProperties.length);
      const prop = demoProperties[propIndex];
      const catIndex = pseudoRandom() > 0.7 ? 6 : 0; // Renhold or Vedlikehold
      const cat = expenseCategories[catIndex];
      payments.push({
        id: `pay-mnt-${month}-${j}`,
        user_id: 'local-user',
        amount: Math.round(cat.range[0] + pseudoRandom() * (cat.range[1] - cat.range[0])),
        payment_type: cat.type,
        payment_status: 'completed',
        payment_method: cat.methods[Math.floor(pseudoRandom() * cat.methods.length)],
        created_at: monthsAgo(month),
        currency: 'NOK',
        description: `${cat.type} - ${prop.address}`,
        property_id: prop.id,
      });
    }
  }

  // A few larger one-off expenses
  payments.push({
    id: 'pay-opp-1',
    user_id: 'local-user',
    amount: 85000,
    payment_type: 'Oppussing',
    payment_status: 'completed',
    payment_method: 'Faktura',
    created_at: monthsAgo(4),
    currency: 'NOK',
    description: 'Bad-renovering - Bygdøy allé 12B',
    property_id: 'prop-1',
  });
  payments.push({
    id: 'pay-opp-2',
    user_id: 'local-user',
    amount: 42000,
    payment_type: 'Oppussing',
    payment_status: 'completed',
    payment_method: 'Faktura',
    created_at: monthsAgo(8),
    currency: 'NOK',
    description: 'Kjøkken maling + nytt gulv - Kirkegata 5',
    property_id: 'prop-2',
  });
  payments.push({
    id: 'pay-jur-1',
    user_id: 'local-user',
    amount: 12500,
    payment_type: 'Juridisk',
    payment_status: 'completed',
    payment_method: 'Faktura',
    created_at: monthsAgo(2),
    currency: 'NOK',
    description: 'Leieavtale-gjennomgang - advokat',
    property_id: null,
  });
  payments.push({
    id: 'pay-takst-1',
    user_id: 'local-user',
    amount: 6500,
    payment_type: 'Takstvurdering',
    payment_status: 'completed',
    payment_method: 'Faktura',
    created_at: monthsAgo(1),
    currency: 'NOK',
    description: 'Takst - Solsiden 8A',
    property_id: 'prop-3',
  });
  payments.push({
    id: 'pay-pending-1',
    user_id: 'local-user',
    amount: 28000,
    payment_type: 'Vedlikehold',
    payment_status: 'pending',
    payment_method: 'Faktura',
    created_at: daysAgo(3),
    currency: 'NOK',
    description: 'Rørlegger - Strandveien 44 (ventende)',
    property_id: 'prop-4',
  });

  // Sort by date descending
  payments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return payments;
};

export const demoPayments = generatePayments();

// ─── Reports ─────────────────────────────────────────────────────────────
export const demoReports = [
  {
    id: 'report-1',
    user_id: 'local-user',
    report_type: 'bank_report',
    generated_at: daysAgo(5),
    file_name: 'Bankrapport_Bygdøy_allé_12B.pdf',
    file_size: 245000,
    property_data: { address: 'Bygdøy allé 12B' },
    calculations: {},
    payment_record_id: null,
    profiles: { full_name: 'Leily', email: 'me@leily.local' },
    payment_records: null,
  },
  {
    id: 'report-2',
    user_id: 'local-user',
    report_type: 'risk_analysis',
    generated_at: daysAgo(12),
    file_name: 'Risikoanalyse_Portefølje.pdf',
    file_size: 180000,
    property_data: {},
    calculations: {},
    payment_record_id: null,
    profiles: { full_name: 'Leily', email: 'me@leily.local' },
    payment_records: null,
  },
];

// ─── User profiles (for admin view) ──────────────────────────────────────
export const demoProfiles = [
  {
    id: 'local-user',
    full_name: 'Leily',
    email: 'me@leily.local',
    role: 'admin',
    created_at: '2018-01-01T10:00:00Z',
  },
];

// ─── Rent Payment Tracking (Husleieoppfølging) ──────────────────────────
// Tracks monthly rent payments per lease — inspired by husleie.no / hybel.no
const generateRentPayments = () => {
  const rentPayments: Array<{
    id: string;
    lease_id: string;
    property_id: string;
    tenant_name: string;
    amount: number;
    due_date: string;
    paid_date: string | null;
    status: 'paid' | 'pending' | 'overdue';
    payment_method: string | null;
    month_label: string;
  }> = [];

  // Active leases with rent tracking
  const activeLeaseData = [
    { leaseId: 'lease-1', propertyId: 'prop-1', tenant: 'Erik Hansen', rent: 22000 },
    { leaseId: 'lease-2', propertyId: 'prop-2', tenant: 'Maria Olsen', rent: 14500 },
    { leaseId: 'lease-3', propertyId: 'prop-3', tenant: 'Thomas Berg', rent: 18000 },
    { leaseId: 'lease-4', propertyId: 'prop-4', tenant: 'Ingrid Larsen', rent: 15500 },
  ];

  let seed = 137;
  const rng = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  const paymentMethods = ['Bankoverføring', 'AvtaleGiro', 'Vipps'];

  // Generate 12 months of rent payment records
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() - monthOffset);
    dueDate.setDate(1); // Due on the 1st

    const monthLabel = dueDate.toLocaleDateString('no-NO', { month: 'short', year: 'numeric' });
    const dueDateStr = dueDate.toISOString().substring(0, 10);

    activeLeaseData.forEach((lease) => {
      const r = rng();
      let status: 'paid' | 'pending' | 'overdue';
      let paidDate: string | null = null;
      let method: string | null = null;

      if (monthOffset === 0) {
        // Current month: mix of paid / pending
        if (r > 0.4) {
          status = 'paid';
          const payDay = new Date(dueDate);
          payDay.setDate(1 + Math.floor(rng() * 5));
          paidDate = payDay.toISOString().substring(0, 10);
          method = paymentMethods[Math.floor(rng() * paymentMethods.length)];
        } else {
          status = 'pending';
        }
      } else if (monthOffset === 1 && r > 0.85) {
        // Last month: occasional late / overdue
        status = 'overdue';
      } else {
        // Older months: mostly paid, small chance late
        status = 'paid';
        const payDay = new Date(dueDate);
        const lateDays = r > 0.9 ? Math.floor(rng() * 15) + 5 : Math.floor(rng() * 4);
        payDay.setDate(1 + lateDays);
        paidDate = payDay.toISOString().substring(0, 10);
        method = paymentMethods[Math.floor(rng() * paymentMethods.length)];
      }

      rentPayments.push({
        id: `rp-${lease.leaseId}-${monthOffset}`,
        lease_id: lease.leaseId,
        property_id: lease.propertyId,
        tenant_name: lease.tenant,
        amount: lease.rent,
        due_date: dueDateStr,
        paid_date: paidDate,
        status,
        payment_method: method,
        month_label: monthLabel,
      });
    });
  }

  return rentPayments;
};

export const demoRentPayments = generateRentPayments();
