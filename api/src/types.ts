// ─── Hono environment types ─────────────────────────────
// Shared across all routes for typed c.get("userId") etc.

export type Env = {
  Variables: {
    user: { id: string; email: string; full_name?: string };
    userId: string;
  };
};
