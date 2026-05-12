const SUPABASE_URL = 'https://vtoadnujpxsiruwmtvlm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fYr8fGD0hRXOBktlBy-q-Q_CnLrBQ5y';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase client library failed to load. Make sure the CDN script is included before supabase.js.');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.supabaseClient = supabase;
