import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import type { Context as HonoContext } from "hono";

interface Env {
	DB: D1Database;
	VALUE_FROM_CLOUDFLARE: string;
}

const app = new Hono<{ Bindings: Env }>();

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

// API endpoint for test page
app.get("/api/test", async (c) => {
	try {
		// Return test data
		const testData = {
			message: "Hello from the Hono backend API!",
			timestamp: new Date().toISOString(),
			endpoint: "/api/test",
			method: "GET"
		};

		return c.json({
			success: true,
			data: testData
		});
	} catch (error) {
		console.error("Error in test endpoint:", error);
		return c.json(
			{ success: false, error: "Failed to fetch test data" },
			500
		);
	}
});

// User API endpoints
app.delete("/api/users/:id", async (c) => {
	try {
		const userId = c.req.param("id");

		// First, delete all todos associated with this user (due to foreign key constraint)
		await c.env.DB.prepare(`
			DELETE FROM todos
			WHERE user_id = ?
		`).bind(userId).run();

		// Then delete the user
		const result = await c.env.DB.prepare(`
			DELETE FROM users
			WHERE id = ?
		`).bind(userId).run();

		if (result.meta.changes === 0) {
			return c.json(
				{ success: false, error: "User not found" },
				404
			);
		}

		return c.json({
			success: true,
			message: "User deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting user:", error);
		return c.json(
			{ success: false, error: "Failed to delete user" },
			500
		);
	}
});

// Todo API endpoints
app.get("/api/todos/:userId", async (c) => {
	try {
		const userId = c.req.param("userId");

		const result = await c.env.DB.prepare(`
			SELECT id, user_id, text, type, completed, created_at, updated_at
			FROM todos
			WHERE user_id = ?
			ORDER BY created_at DESC
		`).bind(userId).all();

		return c.json({
			success: true,
			data: result.results
		});
	} catch (error) {
		console.error("Error fetching todos:", error);
		return c.json(
			{ success: false, error: "Failed to fetch todos" },
			500
		);
	}
});

app.post("/api/todos", async (c) => {
	try {
		const { userId, text, type } = await c.req.json();

		if (!userId || !text) {
			return c.json(
				{ success: false, error: "User ID and text are required" },
				400
			);
		}

		const result = await c.env.DB.prepare(`
			INSERT INTO todos (user_id, text, type)
			VALUES (?, ?, ?)
		`).bind(userId, text, type || 'personal').run();

		const newTodo = await c.env.DB.prepare(`
			SELECT id, user_id, text, type, completed, created_at, updated_at
			FROM todos
			WHERE id = ?
		`).bind(result.meta.last_row_id).first();

		return c.json({
			success: true,
			data: newTodo
		});
	} catch (error) {
		console.error("Error creating todo:", error);
		return c.json(
			{ success: false, error: "Failed to create todo" },
			500
		);
	}
});

app.put("/api/todos/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const { completed } = await c.req.json();

		await c.env.DB.prepare(`
			UPDATE todos
			SET completed = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).bind(completed, id).run();

		const updatedTodo = await c.env.DB.prepare(`
			SELECT id, user_id, text, type, completed, created_at, updated_at
			FROM todos
			WHERE id = ?
		`).bind(id).first();

		return c.json({
			success: true,
			data: updatedTodo
		});
	} catch (error) {
		console.error("Error updating todo:", error);
		return c.json(
			{ success: false, error: "Failed to update todo" },
			500
		);
	}
});

app.delete("/api/todos/:id", async (c) => {
	try {
		const id = c.req.param("id");

		await c.env.DB.prepare(`
			DELETE FROM todos
			WHERE id = ?
		`).bind(id).run();

		return c.json({
			success: true,
			message: "Todo deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting todo:", error);
		return c.json(
			{ success: false, error: "Failed to delete todo" },
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
