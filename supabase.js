const SUPABASE_URL = 'https://akyshgjqynudwuvmlzop.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ZhzpyvvvFtFyhN4SWpMqOw_-sFhuJLg';

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    throw new Error('Supabase client library failed to load. Make sure the CDN script is included before supabase.js.');
}

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.supabaseClient = supabase;
