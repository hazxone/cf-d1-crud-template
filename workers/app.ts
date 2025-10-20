import { Hono } from "hono";
import { createRequestHandler } from "react-router";
import type { Context as HonoContext } from "hono";

interface Env {
	DB: D1Database;
	VALUE_FROM_CLOUDFLARE: string;
}

// Password hashing utilities
async function hashPassword(password: string): Promise<string> {
	// Generate a random salt
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// Encode the password
	const encoder = new TextEncoder();
	const passwordBuffer = encoder.encode(password);

	// Combine password and salt
	const passwordWithSalt = new Uint8Array(passwordBuffer.length + salt.length);
	passwordWithSalt.set(passwordBuffer);
	passwordWithSalt.set(salt, passwordBuffer.length);

	// Hash the password with salt using PBKDF2
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		passwordWithSalt,
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt: salt,
			iterations: 100000,
			hash: 'SHA-256'
		},
		keyMaterial,
		256 // 256 bits
	);

	// Combine salt and hash, then convert to base64
	const hashArray = new Uint8Array(derivedBits);
	const resultArray = new Uint8Array(salt.length + hashArray.length);
	resultArray.set(salt);
	resultArray.set(hashArray, salt.length);

	return btoa(String.fromCharCode(...resultArray));
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	try {
		// Decode the stored hash
		const fullArray = new Uint8Array(
			atob(hashedPassword).split('').map(char => char.charCodeAt(0))
		);

		// Extract salt (first 16 bytes) and hash (remaining bytes)
		const salt = fullArray.slice(0, 16);
		const storedHash = fullArray.slice(16);

		// Encode the password to verify
		const encoder = new TextEncoder();
		const passwordBuffer = encoder.encode(password);

		// Combine password and salt
		const passwordWithSalt = new Uint8Array(passwordBuffer.length + salt.length);
		passwordWithSalt.set(passwordBuffer);
		passwordWithSalt.set(salt, passwordBuffer.length);

		// Hash the provided password with the same salt
		const keyMaterial = await crypto.subtle.importKey(
			'raw',
			passwordWithSalt,
			{ name: 'PBKDF2' },
			false,
			['deriveBits']
		);

		const derivedBits = await crypto.subtle.deriveBits(
			{
				name: 'PBKDF2',
				salt: salt,
				iterations: 100000,
				hash: 'SHA-256'
			},
			keyMaterial,
			256
		);

		// Compare the hashes
		const newHashArray = new Uint8Array(derivedBits);

		if (storedHash.length !== newHashArray.length) {
			return false;
		}

		for (let i = 0; i < storedHash.length; i++) {
			if (storedHash[i] !== newHashArray[i]) {
				return false;
			}
		}

		return true;
	} catch (error) {
		console.error('Password verification error:', error);
		return false;
	}
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

// Authentication API endpoints
app.post("/api/auth/login", async (c) => {
	try {
		const { email, password } = await c.req.json();

		// Validate required fields
		if (!email || !password) {
			return c.json(
				{ success: false, error: "Email and password are required" },
				400
			);
		}

		// Find user by email
		const user = await c.env.DB.prepare(`
			SELECT id, email, username, first_name, last_name, avatar_url, email_verified, is_active, role, password_hash, created_at, last_login_at
			FROM users
			WHERE email = ?
		`).bind(email).first() as any;

		if (!user) {
			return c.json(
				{ success: false, error: "Invalid email or password" },
				401
			);
		}

		// Check if user is active
		if (!user.is_active) {
			return c.json(
				{ success: false, error: "Account is deactivated" },
				401
			);
		}

		// Verify password
		const isPasswordValid = await verifyPassword(password, user.password_hash);
		if (!isPasswordValid) {
			return c.json(
				{ success: false, error: "Invalid email or password" },
				401
			);
		}

		// Update last login time
		await c.env.DB.prepare(`
			UPDATE users
			SET last_login_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`).bind(user.id).run();

		// Remove password_hash from response for security
		const { password_hash, ...userWithoutPassword } = user;

		return c.json({
			success: true,
			data: userWithoutPassword,
			message: "Login successful"
		});
	} catch (error) {
		console.error("Login error:", error);
		return c.json(
			{ success: false, error: "Login failed" },
			500
		);
	}
});

// User API endpoints
app.post("/api/users", async (c) => {
	try {
		const { email, username, password, firstName, lastName } = await c.req.json();

		// Validate required fields
		if (!email || !username || !password) {
			return c.json(
				{ success: false, error: "Email, username, and password are required" },
				400
			);
		}

		// Check if email or username already exists
		const existingUser = await c.env.DB.prepare(`
			SELECT id FROM users WHERE email = ? OR username = ?
		`).bind(email, username).first();

		if (existingUser) {
			return c.json(
				{ success: false, error: "Email or username already exists" },
				409
			);
		}

		// Hash the password using Web Crypto API
		const passwordHash = await hashPassword(password);

		// Insert the new user
		const result = await c.env.DB.prepare(`
			INSERT INTO users (email, username, password_hash, first_name, last_name, avatar_url, email_verified, is_active, role, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`).bind(
			email,
			username,
			passwordHash,
			firstName || null,
			lastName || null,
			`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, // Generate avatar
			false, // email_verified
			true,  // is_active
			'user', // role
		).run();

		// Get the newly created user
		const newUser = await c.env.DB.prepare(`
			SELECT id, email, username, first_name, last_name, avatar_url, email_verified, is_active, role, created_at, last_login_at
			FROM users
			WHERE id = ?
		`).bind(result.meta.last_row_id).first();

		return c.json({
			success: true,
			data: newUser,
			message: "User created successfully"
		});
	} catch (error) {
		console.error("Error creating user:", error);
		return c.json(
			{ success: false, error: "Failed to create user" },
			500
		);
	}
});

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
