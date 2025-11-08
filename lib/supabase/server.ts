import { createClient } from '@supabase/supabase-js';

// For server-side operations (API routes)
// This file should only be imported in server components or API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
