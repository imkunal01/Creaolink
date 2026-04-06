import { createClient } from "@supabase/supabase-js";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

let browserClient: SupabaseBrowserClient | null = null;

function getClientEnv(name: string): string {
	const value = process.env[name];
	if (!value) {
		throw new Error(`[Supabase] Missing required environment variable: ${name}`);
	}
	return value;
}

export function getSupabase(): SupabaseBrowserClient {
	if (browserClient) return browserClient;

	const supabaseUrl = getClientEnv("NEXT_PUBLIC_SUPABASE_URL");
	const supabaseAnonKey = getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
	browserClient = createClient(supabaseUrl, supabaseAnonKey);

	return browserClient;
}
