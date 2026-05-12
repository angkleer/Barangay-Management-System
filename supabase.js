const SUPABASE_URL = 'https://vtoadnujpxsiruwmtvlm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fYr8fGD0hRXOBktlBy-q-Q_CnLrBQ5y';

if (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    window.supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );
} else {
    console.warn('Supabase client was not initialized. Check supabase.js configuration.');
}
