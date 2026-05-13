import {
  demoProperties,
  demoPayments,
  demoValuations,
  demoLeases,
  demoReports,
  demoProfiles,
} from './demoData';

type LocalResult<T = unknown> = {
  data: T;
  error: null;
  count: number | null;
  status: number;
  statusText: string;
};

type LocalUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name: string;
  };
};

const localUser: LocalUser = {
  id: 'local-user',
  email: 'me@leily.local',
  user_metadata: {
    full_name: 'Leily',
  },
};

const ok = <T,>(data: T, count: number | null = null): LocalResult<T> => ({
  data,
  error: null,
  count,
  status: 200,
  statusText: 'OK',
});

// ─── In-memory data store (mutable, persists during session) ─────────────
// Deep-clone demo data so mutations don't affect the originals
const store: Record<string, unknown[]> = {
  properties: JSON.parse(JSON.stringify(demoProperties)),
  payment_records: JSON.parse(JSON.stringify(demoPayments)),
  property_valuations: JSON.parse(JSON.stringify(demoValuations)),
  lease_agreements: JSON.parse(JSON.stringify(demoLeases)),
  reports: JSON.parse(JSON.stringify(demoReports)),
  profiles: JSON.parse(JSON.stringify(demoProfiles)),
};

const getTableData = (tableName: string): unknown[] => {
  return store[tableName] || [];
};

class LocalQueryBuilder {
  private mode: 'many' | 'single' = 'many';
  private payload: unknown = null;
  private tableName: string;
  private hasExplicitPayload = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  private chain = (...args: unknown[]) => {
    void args;
    return this;
  };

  select = this.chain;
  order = this.chain;
  eq = this.chain;
  neq = this.chain;
  in = this.chain;
  is = this.chain;
  not = this.chain;
  or = this.chain;
  ilike = this.chain;
  like = this.chain;
  gte = this.chain;
  gt = this.chain;
  lte = this.chain;
  lt = this.chain;
  contains = this.chain;
  range = this.chain;
  limit = this.chain;

  insert = (payload: unknown) => {
    this.payload = payload;
    this.hasExplicitPayload = true;
    // Actually insert into store
    const items = Array.isArray(payload) ? payload : [payload];
    const table = store[this.tableName] || [];
    items.forEach(item => table.push(item));
    store[this.tableName] = table;
    return this;
  };

  update = (payload: unknown) => {
    this.payload = payload;
    this.hasExplicitPayload = true;
    return this;
  };

  upsert = (payload: unknown) => {
    this.payload = payload;
    this.hasExplicitPayload = true;
    const items = Array.isArray(payload) ? payload : [payload];
    const table = store[this.tableName] || [];
    items.forEach(item => {
      const existing = table.findIndex((r: any) => r.id === (item as any).id);
      if (existing >= 0) {
        table[existing] = { ...table[existing] as any, ...item as any };
      } else {
        table.push(item);
      }
    });
    store[this.tableName] = table;
    return this;
  };

  delete = () => {
    this.payload = [];
    this.hasExplicitPayload = true;
    return this;
  };

  single = () => {
    this.mode = 'single';
    return this;
  };

  maybeSingle = () => {
    this.mode = 'single';
    return this;
  };

  then<TResult1 = LocalResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: LocalResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return Promise.resolve(this.resolve()).then(onfulfilled, onrejected);
  }

  private resolve() {
    // If an explicit payload was set (insert/update/upsert/delete), return it
    if (this.hasExplicitPayload) {
      if (this.mode === 'single') {
        const [first] = Array.isArray(this.payload) ? this.payload : [this.payload].filter(Boolean);
        return ok(first ?? null, first ? 1 : 0);
      }
      return ok(
        Array.isArray(this.payload) ? this.payload : [this.payload],
        Array.isArray(this.payload) ? this.payload.length : 1
      );
    }

    // Otherwise return demo data from store
    const tableData = getTableData(this.tableName);
    if (this.mode === 'single') {
      return ok(tableData[0] ?? null, tableData.length > 0 ? 1 : 0);
    }
    return ok(tableData, tableData.length);
  }
}

const localFunctionData = (name: string) => {
  switch (name) {
    case 'rate-limiter':
      return { allowed: true, remaining: 999, resetTime: new Date(Date.now() + 60_000).toISOString() };
    case 'property-valuation':
      return { estimated_value: null, confidence: 'local', source: 'local-only' };
    case 'estimate-electricity':
      return { estimatedMonthlyCost: null, source: 'local-only' };
    case 'calculator-ai-chat':
    case 'agent-007':
    case 'utleie-agent-chat':
      return {
        message: 'AI-funksjoner er deaktivert i lokal-only modus.',
        response: 'AI-funksjoner er deaktivert i lokal-only modus.',
        sessionId: 'local-session',
      };
    case 'send-leily-email':
    case 'send-lease-notification/email':
      return { success: true, messageId: 'local-only' };
    case 'geocode-address':
    default:
      return null;
  }
};

export const isRemoteDataConfigured = false;

export const localData = {
  from: (tableName: string) => {
    return new LocalQueryBuilder(tableName);
  },
  auth: {
    getUser: async () => ({ data: { user: localUser }, error: null }),
    getSession: async () => ({ data: { session: { user: localUser } }, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
  },
  functions: {
    invoke: async (name: string, options?: unknown) => {
      void options;
      return { data: localFunctionData(name), error: null };
    },
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string) => ({ data: { path, bucket }, error: null }),
      remove: async () => ({ data: [], error: null }),
      list: async () => ({ data: [], error: null }),
      download: async () => ({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: path ? `/local-storage/${bucket}/${path}` : '' } }),
    }),
  },
  channel: (name: string) => ({
    on: () => localData.channel(name),
    subscribe: (callback?: (status: string) => void) => {
      callback?.('SUBSCRIBED');
      return localData.channel(name);
    },
    unsubscribe: async () => 'ok',
  }),
  removeChannel: async () => 'ok',
};
