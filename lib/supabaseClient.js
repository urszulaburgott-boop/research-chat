// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Jediný exportovaný klient – používejme všude stejně
export const supabase = createClient(url, anon, {
  realtime: { params: { eventsPerSecond: 5 } },
});
