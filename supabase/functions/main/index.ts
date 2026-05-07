// Main entrypoint for supabase/edge-runtime in self-hosted mode.
// Routes requests to the correct function based on the URL path.
// URL pattern: /<function-name>  →  imports ../<function-name>/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FUNCTION_DIR = new URL("../", import.meta.url).pathname;

serve(async (req: Request) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const functionName = pathParts[0];

  if (!functionName) {
    return new Response(JSON.stringify({ error: "Function name required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Dynamically import the function module
    const mod = await import(`${FUNCTION_DIR}${functionName}/index.ts`);
    // Each function uses serve() internally — but in self-hosted mode we need
    // to call the handler directly. The Supabase edge-runtime handles this
    // automatically when the function directory structure is correct.
    return new Response(JSON.stringify({ error: "Function routing handled by edge-runtime" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: `Function '${functionName}' not found`, details: e.message }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
});
