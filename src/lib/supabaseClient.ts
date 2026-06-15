import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Do not commit actual credentials.
// Use environment variables or a secure configuration mechanism.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
