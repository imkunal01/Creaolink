import { createClient } from "@supabase/supabase-js";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

let browserClient: SupabaseBrowserClient | null = null;

export function getSupabase(): SupabaseBrowserClient {
	if (browserClient) return browserClient;

	// NEXT_PUBLIC_* variables must be referenced statically so Next can inline
	// them into the client bundle.
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl) {
		throw new Error(
			"[Supabase] Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL"
		);
	}

	if (!supabaseAnonKey) {
		throw new Error(
			"[Supabase] Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY"
		);
	}

	browserClient = createClient(supabaseUrl, supabaseAnonKey);

	return browserClient;
}
