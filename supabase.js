const SUPABASE_URL = 'https://vtoadnujpxsiruwmtvlm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fYr8fGD0hRXOBktlBy-q-Q_CnLrBQ5y';

function createRestSupabaseClient(baseUrl, apiKey) {
    class QueryBuilder {
        constructor(table) {
            this.table = table;
            this.method = 'GET';
            this.filters = [];
            this.orderBy = null;
            this.body = null;
            this.returning = false;
            this.expectSingle = false;
            this.headers = {
                apikey: apiKey,
                Authorization: `Bearer ${apiKey}`
            };
        }

        select(columns = '*') {
            this.columns = columns;
            this.returning = true;
            return this;
        }

        insert(payload) {
            this.method = 'POST';
            this.body = payload;
            return this;
        }

        upsert(payload) {
            this.method = 'POST';
            this.body = payload;
            this.headers.Prefer = 'resolution=merge-duplicates';
            return this;
        }

        update(payload) {
            this.method = 'PATCH';
            this.body = payload;
            return this;
        }

        delete() {
            this.method = 'DELETE';
            return this;
        }

        eq(column, value) {
            const encodedValue = typeof value === 'string' ? `"${value}"` : value;
            this.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(encodedValue)}`);
            return this;
        }

        order(column, options = {}) {
            const direction = options.ascending === false ? 'desc' : 'asc';
            this.orderBy = `${column}.${direction}`;
            return this;
        }

        single() {
            this.expectSingle = true;
            this.headers.Accept = 'application/vnd.pgrst.object+json';
            return this;
        }

        buildUrl() {
            const params = [];
            if (this.columns) {
                params.push(`select=${encodeURIComponent(this.columns)}`);
            }
            if (this.orderBy) {
                params.push(`order=${encodeURIComponent(this.orderBy)}`);
            }
            if (this.filters.length) {
                params.push(...this.filters);
            }

            const query = params.length ? `?${params.join('&')}` : '';
            return `${baseUrl}/rest/v1/${this.table}${query}`;
        }

        async execute() {
            const headers = { ...this.headers };

            if (this.returning) {
                headers.Prefer = headers.Prefer
                    ? `${headers.Prefer},return=representation`
                    : 'return=representation';
            }

            if (this.body !== null) {
                headers['Content-Type'] = 'application/json';
            }

            try {
                const response = await fetch(this.buildUrl(), {
                    method: this.method,
                    headers,
                    body: this.body !== null ? JSON.stringify(this.body) : undefined
                });

                const text = await response.text();
                const data = text ? JSON.parse(text) : null;

                if (!response.ok) {
                    return {
                        data: null,
                        error: {
                            message: data?.message || data?.error_description || response.statusText,
                            details: data?.details || null,
                            hint: data?.hint || null,
                            code: data?.code || `${response.status}`
                        }
                    };
                }

                if (this.expectSingle && Array.isArray(data)) {
                    return { data: data[0] || null, error: null };
                }

                return { data, error: null };
            } catch (error) {
                return {
                    data: null,
                    error: {
                        message: error.message || 'Network request failed.',
                        details: null,
                        hint: null,
                        code: 'FETCH_ERROR'
                    }
                };
            }
        }

        then(resolve, reject) {
            return this.execute().then(resolve, reject);
        }
    }

    return {
        from(table) {
            return new QueryBuilder(table);
        }
    };
}

let supabaseClientInstance = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
} else {
    console.warn('Supabase CDN client not detected. Falling back to REST client.');
    supabaseClientInstance = createRestSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;
window.supabaseClient = supabaseClientInstance;
