import { Hono } from "hono";
import type { Context as HonoContext } from "hono";
import { createAuth } from "./auth";

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

// BetterAuth integration
// Mount BetterAuth handlers for authentication
app.use("/api/auth/*", async (c, next) => {
	// Create auth instance with D1 binding from request context
	const auth = createAuth(c.env.DB);

	// Handle BetterAuth requests
	const response = await auth.handler(c.req.raw);

	// If BetterAuth handled the request, return its response
	if (response) {
		return response;
	}

	// Otherwise, continue to next handler (for custom auth endpoints)
	await next();
});

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
		const { completed, text, type } = await c.req.json();

		// Build dynamic update query based on provided fields
		let updateFields = [];
		let bindValues = [];

		if (completed !== undefined) {
			updateFields.push("completed = ?");
			bindValues.push(completed);
		}

		if (text !== undefined && text !== null) {
			updateFields.push("text = ?");
			bindValues.push(text);
		}

		if (type !== undefined && type !== null) {
			updateFields.push("type = ?");
			bindValues.push(type);
		}

		// Always update the timestamp
		updateFields.push("updated_at = CURRENT_TIMESTAMP");

		// Add id to bind values
		bindValues.push(id);

		// Execute update if there are fields to update
		if (updateFields.length > 1) { // More than just updated_at
			const updateQuery = `
				UPDATE todos
				SET ${updateFields.join(", ")}
				WHERE id = ?
			`;

			await c.env.DB.prepare(updateQuery).bind(...bindValues).run();
		}

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

// PKM System - Item API endpoints

// Get all items for a user (with tags)
app.get("/api/items/:userId", async (c) => {
	try {
		const userId = c.req.param("userId");

		// Fetch items
		const items = await c.env.DB.prepare(`
			SELECT id, user_id, content, item_type, completed, priority, due_date, pinned, archived, created_at, updated_at
			FROM items
			WHERE user_id = ? AND archived = FALSE
			ORDER BY pinned DESC, created_at DESC
		`).bind(userId).all();

		// Fetch all tags for this user
		const itemsWithTags = await Promise.all(items.results.map(async (item: any) => {
			const tags = await c.env.DB.prepare(`
				SELECT t.id, t.user_id, t.name, t.color, t.created_at
				FROM tags t
				INNER JOIN item_tags it ON t.id = it.tag_id
				WHERE it.item_id = ?
			`).bind(item.id).all();

			return {
				...item,
				tags: tags.results
			};
		}));

		return c.json({
			success: true,
			data: itemsWithTags
		});
	} catch (error) {
		console.error("Error fetching items:", error);
		return c.json(
			{ success: false, error: "Failed to fetch items" },
			500
		);
	}
});

// Create new item (with tags)
app.post("/api/items", async (c) => {
	try {
		const { userId, content, item_type, tags, priority, due_date, pinned } = await c.req.json();

		if (!userId || !content) {
			return c.json(
				{ success: false, error: "User ID and content are required" },
				400
			);
		}

		// Insert item
		const result = await c.env.DB.prepare(`
			INSERT INTO items (user_id, content, item_type, priority, due_date, pinned)
			VALUES (?, ?, ?, ?, ?, ?)
		`).bind(
			userId,
			content,
			item_type || 'task',
			priority || null,
			due_date || null,
			pinned || false
		).run();

		const itemId = result.meta.last_row_id;

		// Add tags if provided
		if (tags && Array.isArray(tags) && tags.length > 0) {
			for (const tagId of tags) {
				await c.env.DB.prepare(`
					INSERT INTO item_tags (item_id, tag_id)
					VALUES (?, ?)
				`).bind(itemId, tagId).run();
			}
		}

		// Fetch the newly created item with tags
		const newItem = await c.env.DB.prepare(`
			SELECT id, user_id, content, item_type, completed, priority, due_date, pinned, archived, created_at, updated_at
			FROM items
			WHERE id = ?
		`).bind(itemId).first();

		const itemTags = await c.env.DB.prepare(`
			SELECT t.id, t.user_id, t.name, t.color, t.created_at
			FROM tags t
			INNER JOIN item_tags it ON t.id = it.tag_id
			WHERE it.item_id = ?
		`).bind(itemId).all();

		return c.json({
			success: true,
			data: {
				...newItem,
				tags: itemTags.results
			}
		});
	} catch (error) {
		console.error("Error creating item:", error);
		return c.json(
			{ success: false, error: "Failed to create item" },
			500
		);
	}
});

// Update item (including tags)
app.put("/api/items/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const { content, item_type, completed, priority, due_date, pinned, archived, tags } = await c.req.json();

		// Build dynamic update query
		let updateFields = [];
		let bindValues = [];

		if (content !== undefined && content !== null) {
			updateFields.push("content = ?");
			bindValues.push(content);
		}

		if (item_type !== undefined && item_type !== null) {
			updateFields.push("item_type = ?");
			bindValues.push(item_type);
		}

		if (completed !== undefined) {
			updateFields.push("completed = ?");
			bindValues.push(completed);
		}

		if (priority !== undefined) {
			updateFields.push("priority = ?");
			bindValues.push(priority);
		}

		if (due_date !== undefined) {
			updateFields.push("due_date = ?");
			bindValues.push(due_date);
		}

		if (pinned !== undefined) {
			updateFields.push("pinned = ?");
			bindValues.push(pinned);
		}

		if (archived !== undefined) {
			updateFields.push("archived = ?");
			bindValues.push(archived);
		}

		// Always update the timestamp
		updateFields.push("updated_at = CURRENT_TIMESTAMP");
		bindValues.push(id);

		// Execute update if there are fields to update
		if (updateFields.length > 1) {
			const updateQuery = `
				UPDATE items
				SET ${updateFields.join(", ")}
				WHERE id = ?
			`;
			await c.env.DB.prepare(updateQuery).bind(...bindValues).run();
		}

		// Update tags if provided
		if (tags !== undefined && Array.isArray(tags)) {
			// Delete existing tags
			await c.env.DB.prepare(`
				DELETE FROM item_tags WHERE item_id = ?
			`).bind(id).run();

			// Add new tags
			for (const tagId of tags) {
				await c.env.DB.prepare(`
					INSERT INTO item_tags (item_id, tag_id)
					VALUES (?, ?)
				`).bind(id, tagId).run();
			}
		}

		// Fetch updated item with tags
		const updatedItem = await c.env.DB.prepare(`
			SELECT id, user_id, content, item_type, completed, priority, due_date, pinned, archived, created_at, updated_at
			FROM items
			WHERE id = ?
		`).bind(id).first();

		const itemTags = await c.env.DB.prepare(`
			SELECT t.id, t.user_id, t.name, t.color, t.created_at
			FROM tags t
			INNER JOIN item_tags it ON t.id = it.tag_id
			WHERE it.item_id = ?
		`).bind(id).all();

		return c.json({
			success: true,
			data: {
				...updatedItem,
				tags: itemTags.results
			}
		});
	} catch (error) {
		console.error("Error updating item:", error);
		return c.json(
			{ success: false, error: "Failed to update item" },
			500
		);
	}
});

// Delete item
app.delete("/api/items/:id", async (c) => {
	try {
		const id = c.req.param("id");

		await c.env.DB.prepare(`
			DELETE FROM items
			WHERE id = ?
		`).bind(id).run();

		return c.json({
			success: true,
			message: "Item deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting item:", error);
		return c.json(
			{ success: false, error: "Failed to delete item" },
			500
		);
	}
});

// Tag API endpoints

// Get all tags for a user
app.get("/api/tags/:userId", async (c) => {
	try {
		const userId = c.req.param("userId");

		const result = await c.env.DB.prepare(`
			SELECT id, user_id, name, color, created_at
			FROM tags
			WHERE user_id = ?
			ORDER BY name ASC
		`).bind(userId).all();

		return c.json({
			success: true,
			data: result.results
		});
	} catch (error) {
		console.error("Error fetching tags:", error);
		return c.json(
			{ success: false, error: "Failed to fetch tags" },
			500
		);
	}
});

// Create new tag
app.post("/api/tags", async (c) => {
	try {
		const { userId, name, color } = await c.req.json();

		if (!userId || !name) {
			return c.json(
				{ success: false, error: "User ID and name are required" },
				400
			);
		}

		// Check if tag already exists for this user
		const existing = await c.env.DB.prepare(`
			SELECT id FROM tags WHERE user_id = ? AND name = ?
		`).bind(userId, name).first();

		if (existing) {
			return c.json(
				{ success: false, error: "Tag with this name already exists" },
				409
			);
		}

		const result = await c.env.DB.prepare(`
			INSERT INTO tags (user_id, name, color)
			VALUES (?, ?, ?)
		`).bind(userId, name, color || '#6366f1').run();

		const newTag = await c.env.DB.prepare(`
			SELECT id, user_id, name, color, created_at
			FROM tags
			WHERE id = ?
		`).bind(result.meta.last_row_id).first();

		return c.json({
			success: true,
			data: newTag
		});
	} catch (error) {
		console.error("Error creating tag:", error);
		return c.json(
			{ success: false, error: "Failed to create tag" },
			500
		);
	}
});

// Update tag
app.put("/api/tags/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const { name, color } = await c.req.json();

		let updateFields = [];
		let bindValues = [];

		if (name !== undefined && name !== null) {
			updateFields.push("name = ?");
			bindValues.push(name);
		}

		if (color !== undefined && color !== null) {
			updateFields.push("color = ?");
			bindValues.push(color);
		}

		if (updateFields.length > 0) {
			bindValues.push(id);
			const updateQuery = `
				UPDATE tags
				SET ${updateFields.join(", ")}
				WHERE id = ?
			`;
			await c.env.DB.prepare(updateQuery).bind(...bindValues).run();
		}

		const updatedTag = await c.env.DB.prepare(`
			SELECT id, user_id, name, color, created_at
			FROM tags
			WHERE id = ?
		`).bind(id).first();

		return c.json({
			success: true,
			data: updatedTag
		});
	} catch (error) {
		console.error("Error updating tag:", error);
		return c.json(
			{ success: false, error: "Failed to update tag" },
			500
		);
	}
});

// Delete tag
app.delete("/api/tags/:id", async (c) => {
	try {
		const id = c.req.param("id");

		// item_tags will be automatically deleted due to CASCADE
		await c.env.DB.prepare(`
			DELETE FROM tags
			WHERE id = ?
		`).bind(id).run();

		return c.json({
			success: true,
			message: "Tag deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting tag:", error);
		return c.json(
			{ success: false, error: "Failed to delete tag" },
			500
		);
	}
});

// Advanced search endpoint
app.get("/api/items/search/:userId", async (c) => {
	try {
		const userId = c.req.param("userId");
		const itemType = c.req.query("item_type");
		const completed = c.req.query("completed");
		const archived = c.req.query("archived");
		const pinned = c.req.query("pinned");
		const search = c.req.query("search");
		const tagIds = c.req.query("tags"); // comma-separated tag IDs

		let query = `
			SELECT DISTINCT i.id, i.user_id, i.content, i.item_type, i.completed, i.priority, i.due_date, i.pinned, i.archived, i.created_at, i.updated_at
			FROM items i
		`;

		let conditions = ["i.user_id = ?"];
		let bindValues: any[] = [userId];

		// Join with tags if filtering by tags
		if (tagIds) {
			query += ` INNER JOIN item_tags it ON i.id = it.item_id`;
			const tagIdArray = tagIds.split(',').map(id => parseInt(id));
			conditions.push(`it.tag_id IN (${tagIdArray.map(() => '?').join(',')})`);
			bindValues.push(...tagIdArray);
		}

		// Add filters
		if (itemType && itemType !== 'all') {
			conditions.push("i.item_type = ?");
			bindValues.push(itemType);
		}

		if (completed !== undefined && completed !== 'all') {
			conditions.push("i.completed = ?");
			bindValues.push(completed === 'true' ? 1 : 0);
		}

		if (archived !== undefined) {
			conditions.push("i.archived = ?");
			bindValues.push(archived === 'true' ? 1 : 0);
		}

		if (pinned !== undefined) {
			conditions.push("i.pinned = ?");
			bindValues.push(pinned === 'true' ? 1 : 0);
		}

		if (search) {
			conditions.push("i.content LIKE ?");
			bindValues.push(`%${search}%`);
		}

		query += ` WHERE ${conditions.join(" AND ")}`;
		query += ` ORDER BY i.pinned DESC, i.created_at DESC`;

		const items = await c.env.DB.prepare(query).bind(...bindValues).all();

		// Fetch tags for each item
		const itemsWithTags = await Promise.all(items.results.map(async (item: any) => {
			const tags = await c.env.DB.prepare(`
				SELECT t.id, t.user_id, t.name, t.color, t.created_at
				FROM tags t
				INNER JOIN item_tags it ON t.id = it.tag_id
				WHERE it.item_id = ?
			`).bind(item.id).all();

			return {
				...item,
				tags: tags.results
			};
		}));

		return c.json({
			success: true,
			data: itemsWithTags
		});
	} catch (error) {
		console.error("Error searching items:", error);
		return c.json(
			{ success: false, error: "Failed to search items" },
			500
		);
	}
});

// Products API endpoints (CRUD Template)

// Get all products
app.get("/api/products", async (c) => {
	try {
		const category = c.req.query("category");
		const search = c.req.query("search");
		const isActive = c.req.query("is_active");

		let query = "SELECT * FROM products WHERE 1=1";
		let bindValues: any[] = [];

		if (category) {
			query += " AND category = ?";
			bindValues.push(category);
		}

		if (search) {
			query += " AND (name LIKE ? OR description LIKE ?)";
			bindValues.push(`%${search}%`, `%${search}%`);
		}

		if (isActive !== undefined) {
			query += " AND is_active = ?";
			bindValues.push(isActive === 'true' ? 1 : 0);
		}

		query += " ORDER BY created_at DESC";

		const result = await c.env.DB.prepare(query).bind(...bindValues).all();

		return c.json({
			success: true,
			data: result.results
		});
	} catch (error) {
		console.error("Error fetching products:", error);
		return c.json(
			{ success: false, error: "Failed to fetch products" },
			500
		);
	}
});

// Get single product
app.get("/api/products/:id", async (c) => {
	try {
		const id = c.req.param("id");

		const product = await c.env.DB.prepare(`
			SELECT * FROM products WHERE id = ?
		`).bind(id).first();

		if (!product) {
			return c.json(
				{ success: false, error: "Product not found" },
				404
			);
		}

		return c.json({
			success: true,
			data: product
		});
	} catch (error) {
		console.error("Error fetching product:", error);
		return c.json(
			{ success: false, error: "Failed to fetch product" },
			500
		);
	}
});

// Create new product
app.post("/api/products", async (c) => {
	try {
		const { name, description, price, stock, category, image_url, is_active } = await c.req.json();

		if (!name || price === undefined) {
			return c.json(
				{ success: false, error: "Name and price are required" },
				400
			);
		}

		const result = await c.env.DB.prepare(`
			INSERT INTO products (name, description, price, stock, category, image_url, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`).bind(
			name,
			description || null,
			price,
			stock || 0,
			category || 'general',
			image_url || null,
			is_active !== undefined ? is_active : true
		).run();

		const newProduct = await c.env.DB.prepare(`
			SELECT * FROM products WHERE id = ?
		`).bind(result.meta.last_row_id).first();

		return c.json({
			success: true,
			data: newProduct,
			message: "Product created successfully"
		});
	} catch (error) {
		console.error("Error creating product:", error);
		return c.json(
			{ success: false, error: "Failed to create product" },
			500
		);
	}
});

// Update product
app.put("/api/products/:id", async (c) => {
	try {
		const id = c.req.param("id");
		const { name, description, price, stock, category, image_url, is_active } = await c.req.json();

		let updateFields = [];
		let bindValues = [];

		if (name !== undefined && name !== null) {
			updateFields.push("name = ?");
			bindValues.push(name);
		}

		if (description !== undefined) {
			updateFields.push("description = ?");
			bindValues.push(description);
		}

		if (price !== undefined) {
			updateFields.push("price = ?");
			bindValues.push(price);
		}

		if (stock !== undefined) {
			updateFields.push("stock = ?");
			bindValues.push(stock);
		}

		if (category !== undefined) {
			updateFields.push("category = ?");
			bindValues.push(category);
		}

		if (image_url !== undefined) {
			updateFields.push("image_url = ?");
			bindValues.push(image_url);
		}

		if (is_active !== undefined) {
			updateFields.push("is_active = ?");
			bindValues.push(is_active);
		}

		updateFields.push("updated_at = CURRENT_TIMESTAMP");
		bindValues.push(id);

		if (updateFields.length > 1) {
			const updateQuery = `
				UPDATE products
				SET ${updateFields.join(", ")}
				WHERE id = ?
			`;
			await c.env.DB.prepare(updateQuery).bind(...bindValues).run();
		}

		const updatedProduct = await c.env.DB.prepare(`
			SELECT * FROM products WHERE id = ?
		`).bind(id).first();

		return c.json({
			success: true,
			data: updatedProduct,
			message: "Product updated successfully"
		});
	} catch (error) {
		console.error("Error updating product:", error);
		return c.json(
			{ success: false, error: "Failed to update product" },
			500
		);
	}
});

// Delete product
app.delete("/api/products/:id", async (c) => {
	try {
		const id = c.req.param("id");

		const result = await c.env.DB.prepare(`
			DELETE FROM products WHERE id = ?
		`).bind(id).run();

		if (result.meta.changes === 0) {
			return c.json(
				{ success: false, error: "Product not found" },
				404
			);
		}

		return c.json({
			success: true,
			message: "Product deleted successfully"
		});
	} catch (error) {
		console.error("Error deleting product:", error);
		return c.json(
			{ success: false, error: "Failed to delete product" },
			500
		);
	}
});

app.get("*", async (c) => {
	// Import the server entry point for TanStack Router
	// @ts-ignore - Vite will handle this import during build
	const { default: handleRequest } = await import("../app/entry.server");

	// Pass the request and Cloudflare context to TanStack Router
	return handleRequest(
		c.req.raw,
		200,
		new Headers(),
		{ env: c.env, ctx: c.executionCtx },
	);
});

export default app;
