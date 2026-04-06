import { createClient } from "@supabase/supabase-js";

type SupabaseServerClient = ReturnType<typeof createClient>;

let adminClient: SupabaseServerClient | null = null;

function getServerEnv(...names: string[]): string {
	for (const name of names) {
		const value = process.env[name];
		if (value) return value;
	}

	throw new Error(
		`[Supabase] Missing required environment variable. Tried: ${names.join(", ")}`
	);
}

function getSupabaseUrl(): string {
	return getServerEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
}

export function getSupabaseAdmin(): SupabaseServerClient {
	if (adminClient) return adminClient;

	const supabaseUrl = getSupabaseUrl();
	const supabaseServiceKey = getServerEnv("SUPABASE_SERVICE_ROLE_KEY");

	adminClient = createClient(supabaseUrl, supabaseServiceKey);
	return adminClient;
}

// Server client — uses service role key, never expose to browser

type SupabaseConnectionCheckResult = {
	ok: boolean;
	source: string;
	url: string;
	urlHost: string;
	error?: string;
};

export async function checkSupabaseServerConnection(
	source = "unknown"
): Promise<SupabaseConnectionCheckResult> {
	const supabaseUrl = getSupabaseUrl();
	const admin = getSupabaseAdmin();

	const urlHost = (() => {
		try {
			return new URL(supabaseUrl).host;
		} catch {
			return "invalid-url";
		}
	})();

	const startedAt = Date.now();

	try {
		const { error } = await admin.auth.admin.listUsers({
			page: 1,
			perPage: 1,
		});

		if (error) {
			console.error("[SupabaseCheck] Connection failed", {
				source,
				url: supabaseUrl,
				urlHost,
				durationMs: Date.now() - startedAt,
				message: error.message,
			});

			return {
				ok: false,
				source,
				url: supabaseUrl,
				urlHost,
				error: error.message,
			};
		}

		console.info("[SupabaseCheck] Connection successful", {
			source,
			url: supabaseUrl,
			urlHost,
			durationMs: Date.now() - startedAt,
		});

		return {
			ok: true,
			source,
			url: supabaseUrl,
			urlHost,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		console.error("[SupabaseCheck] Connection threw", {
			source,
			url: supabaseUrl,
			urlHost,
			durationMs: Date.now() - startedAt,
			message,
		});

		return {
			ok: false,
			source,
			url: supabaseUrl,
			urlHost,
			error: message,
		};
	}
}
