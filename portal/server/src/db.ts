import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data.json");

export type Team = {
	id: string;
	name: string;
	password: string;
	fragments: string[];
	createdAt: string;
	solved?: boolean;
};

export type DBSchema = {
	teams: Record<string, Team>;
};

async function ensureDb(): Promise<DBSchema> {
	try {
		await fs.access(DB_PATH);
	} catch {
		const init: DBSchema = { teams: {} };
		await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
		await fs.writeFile(DB_PATH, JSON.stringify(init, null, 2), "utf-8");
		return init;
	}
	const raw = await fs.readFile(DB_PATH, "utf-8");
	try {
		const parsed = JSON.parse(raw) as DBSchema;
		if (!parsed.teams) parsed.teams = {};
		return parsed;
	} catch {
		const init: DBSchema = { teams: {} };
		await fs.writeFile(DB_PATH, JSON.stringify(init, null, 2), "utf-8");
		return init;
	}
}

// keep the writeLock strongly typed as Promise<void>
let writeLock: Promise<void> = Promise.resolve();

/**
 * Serializes writes to disk. Returns the value returned by the provided fn.
 */
async function withWrite<T>(fn: (db: DBSchema) => Promise<T>): Promise<T> {
	let result: T;
	// queue a task; writeLock always remains a Promise<void>
	writeLock = writeLock.then(async () => {
		const db = await ensureDb();
		// run user's mutation/read function and capture the result
		result = await fn(db);
		// persist to disk
		await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
	});
	// wait for our queued task to finish
	await writeLock;
	// result has been assigned inside the queued task
	return result!;
}

/**
 * Read-only helper (no locking required)
 */
async function withRead<T>(fn: (db: DBSchema) => Promise<T>): Promise<T> {
	const db = await ensureDb();
	return fn(db);
}

function splitIntoFragments(password: string, count: number): string[] {
	if (count <= 1) return [password];
	const len = password.length;
	const base = Math.floor(len / count);
	const rem = len % count;
	const out: string[] = [];
	let i = 0;
	for (let k = 0; k < count; k++) {
		const take = base + (k < rem ? 1 : 0);
		out.push(password.substr(i, take));
		i += take;
	}
	return out;
}

function makeVikingName() {
	let vikingNames = ["Harald", "Gorm"];
	let idx = Math.floor(Math.random() * vikingNames.length);
	return vikingNames[idx];
}

/**
 * Create a team. Ensures generated friendly names don't collide with existing names by appending -2, -3...
 */
export async function createTeam(password: string, fragmentsCount = 2): Promise<Team> {
	return withWrite(async (db) => {
		// collect existing names (lowercased) for quick lookup
		const existing = new Set(Object.values(db.teams || {}).map((t) => (t.name || "").toLowerCase()));

		let baseName = makeVikingName();
		let name = baseName;
		if (existing.has(name.toLowerCase())) {
			let i = 2;
			while (existing.has(`${baseName}-${i}`.toLowerCase())) i++;
			name = `${baseName}-${i}`;
		}

		const team: Team = {
			id: randomUUID(),
			name,
			password,
			fragments: splitIntoFragments(password, fragmentsCount),
			createdAt: new Date().toISOString(),
			solved: false
		};

		db.teams[team.id] = team;
		return team;
	});
}

export async function getTeam(teamId: string): Promise<Team | null> {
	const db = await ensureDb();
	return db.teams[teamId] ?? null;
}

export async function getLatestTeam(): Promise<Team | null> {
	const db = await ensureDb();
	const teams = Object.values(db.teams ?? {});
	let latest: Team | null = null;

	for (const t of teams) {
		if (!t) continue;
		if (latest === null) {
			latest = t;
			continue;
		}

		const tTs = Date.parse(t.createdAt ?? "");
		const lTs = Date.parse(latest.createdAt ?? "");

		// Prefer valid timestamps; if both invalid, keep current latest.
		if (isNaN(tTs) && isNaN(lTs)) continue;
		if (isNaN(lTs) || (!isNaN(tTs) && tTs > lTs)) latest = t;
	}
	return latest;
}

export async function verifyTeamPassword(teamId: string, supplied: string): Promise<{ ok: boolean; message?: string }> {
	return withWrite(async (db) => {
		const team = db.teams[teamId];
		if (!team) return { ok: false, message: "Team not found" };
		if (team.solved) return { ok: false, message: "Already solved" };
		if (team.password === supplied) {
			team.solved = true;
			return { ok: true };
		} else {
			return { ok: false, message: "Incorrect password" };
		}
	});
}

export async function getFragments(teamId: string): Promise<string[] | null> {
	const team = await getTeam(teamId);
	return team ? team.fragments : null;
}

/**
 * Find teams by friendly name (case-insensitive exact match).
 * Returns an array (possibly empty). Useful for resolving a friendly name to UUID(s).
 */
export async function findTeamsByName(name: string): Promise<Team[]> {
	const q = name.trim().toLowerCase();
	if (!q) return [];
	const db = await ensureDb();
	return Object.values(db.teams ?? {}).filter((t) => (t.name ?? "").toLowerCase() === q);
}
