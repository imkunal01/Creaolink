import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server client — uses service role key, never expose to browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
	const urlHost = (() => {
		try {
			return new URL(supabaseUrl).host;
		} catch {
			return "invalid-url";
		}
	})();

	const startedAt = Date.now();

	try {
		const { error } = await supabaseAdmin.auth.admin.listUsers({
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
