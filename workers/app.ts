import { Hono } from "hono";
import { createRequestHandler } from "react-router";

const app = new Hono();

// Add more routes here

// API endpoint to fetch users
app.get("/api/users", async (c) => {
	try {
		const result = await c.env.DB.prepare(`
			SELECT id, email, username, first_name, last_name, avatar_url, email_verified, is_active, role, created_at, last_login_at
			FROM users
			ORDER BY created_at DESC
		`).all();

		return c.json({
			success: true,
			data: result.results
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		return c.json(
			{ success: false, error: "Failed to fetch users" },
			500
		);
	}
});

app.get("*", (c) => {
	const requestHandler = createRequestHandler(
		() => import("virtual:react-router/server-build"),
		import.meta.env.MODE,
	);

	return requestHandler(c.req.raw, {
		cloudflare: { env: c.env, ctx: c.executionCtx },
	});
});

export default app;
