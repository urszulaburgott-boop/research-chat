// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Důležité: aby “INSERT” ze stránky fungovaly s RLS, musí být klíče správně ve Vercelu.
export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
