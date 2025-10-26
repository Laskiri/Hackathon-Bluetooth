import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data.json");

export type Fragment = {
	pass_fragment: string;
	solved: boolean;
	solvedAt: string;
	score?: number;
};

export type Team = {
	id: string;
	name: string;
	password: string;
	fragments: Record<string, Fragment>;
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

/**
 * Split string password into an array of substring fragments while preferring whole-word splits.
 * This returns an array of fragment strings (not Fragment objects).
 */
function splitPassword(password: string, count: number): string[] {
	if (count <= 1) return [password];

	const words = password.trim().split(/\s+/).filter(Boolean);

	function charSplit(s: string, n: number): string[] {
		const out: string[] = [];
		const len = s.length;
		if (len === 0) return Array(n).fill("");
		const base = Math.floor(len / n);
		const rem = len % n;
		let i = 0;
		for (let k = 0; k < n; k++) {
			const take = base + (k < rem ? 1 : 0);
			out.push(s.substr(i, take));
			i += take;
		}
		return out;
	}

	if (words.length === 0) return Array(count).fill("");

	// If we have >= count words, distribute whole words among fragments as evenly as possible.
	if (words.length >= count) {
		const out: string[] = [];
		const base = Math.floor(words.length / count);
		const rem = words.length % count; // first `rem` groups get one extra word
		let idx = 0;
		for (let k = 0; k < count; k++) {
			const take = k < rem ? base + 1 : base;
			if (take === 0) {
				out.push("");
			} else {
				out.push(words.slice(idx, idx + take).join(" "));
				idx += take;
			}
		}
		return out;
	}

	// Fewer words than fragments: fall back to character-balanced split of the joined words.
	const joined = words.join(" ");
	return charSplit(joined, count);
}

/**
 * Convert string fragments into Fragment objects and return an object keyed by "0".."n-1".
 */
function splitIntoFragments(password: string, count: number): Record<string, Fragment> {
	const pass_fragments: string[] = splitPassword(password, count);

	const fragmentsObj: Record<string, Fragment> = {};
	for (let i = 0; i < pass_fragments.length; i++) {
		fragmentsObj[String(i)] = {
			pass_fragment: pass_fragments[i],
			solved: false,
			solvedAt: "", // empty until solved
		};
	}
	for (let i = pass_fragments.length; i < count; i++) {
		fragmentsObj[String(i)] = {
			pass_fragment: "",
			solved: false,
			solvedAt: "",
		};
	}
	return fragmentsObj;
}

function makeVikingName() {
	let vikingNames = ["Harald", "Gorm"];
	let idx = Math.floor(Math.random() * vikingNames.length);
	return vikingNames[idx];
}

/**
 * Create a team. Ensures generated friendly names don't collide with existing names by appending -2, -3...
 */
export async function createTeam(password: string, fragmentsCount = 2, desiredName?: string): Promise<Team> {
	return withWrite(async (db) => {
		// collect existing names (lowercased) for quick lookup
		const existing = new Set(Object.values(db.teams || {}).map((t) => (t.name || "").toLowerCase()));

		let baseName = (typeof desiredName === "string" && desiredName.trim().length > 0) ? desiredName.trim() : makeVikingName();
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

export async function completeRunestone(teamId: string, fragmentId: string | number): Promise<{ ok: boolean; message?: string; team?: Team; fragment?: Fragment }> {
	return withWrite(async (db) => {
		const team = db.teams[teamId];
		if (!team) return { ok: false, message: "Team not found" };

		const key = String(fragmentId);
		if (!team.fragments || !(key in team.fragments)) return { ok: false, message: "Fragment not found" };

		const frag = team.fragments[key];
		if (frag.solved) return { ok: false, message: "Fragment already solved", fragment: frag, team };

		// mark solved
		const nowIso = new Date().toISOString();
		frag.solved = true;
		frag.solvedAt = nowIso;

		// compute minutes between team.createdAt and solvedAt
		function minutesBetween(startIso?: string, endIso?: string): number {
			if (!startIso || !endIso) return 0;
			const s = new Date(startIso);
			const e = new Date(endIso);
			if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
			const mins = Math.floor((e.getTime() - s.getTime()) / 60000);
			return Math.max(0, mins);
		}

		const minutes = minutesBetween(team.createdAt, frag.solvedAt);

		// scoring formula: 100 - 2 * minutes, clamp to integer in [0,100]
		let score = Math.round(100 - 2 * minutes);
		if (!Number.isFinite(score)) score = 0;
		if (score < 0) score = 0;
		if (score > 100) score = 100;

		frag.score = score;

		// if all fragments solved, mark team solved
		const allSolved = Object.values(team.fragments).every((f) => f.solved === true);
		if (allSolved) team.solved = true;

		return { ok: true, team, fragment: frag };
	});
}


export async function verifyTeamPassword(teamId: string, supplied: string): Promise<{ ok: boolean; message?: string }> {
	return withWrite(async (db) => {
		const team = db.teams[teamId];
		if (!team) return { ok: false, message: "Team not found" };
		if (team.password === supplied) {
			team.solved = true;
			return { ok: true };
		} else {
			return { ok: false, message: "Incorrect password" };
		}
	});
}

export async function getFragments(teamId: string): Promise<Record<string, Fragment> | null> {
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
export async function getLeaderboard(): Promise<
	{ id: string; name: string; createdAt: string; solved: boolean; score: number }[]
> {
	const db = await ensureDb();
	const teams = Object.values(db.teams ?? {});

	const entries = teams.map((t) => {
		// handle both object keyed fragments and legacy array shape
		const fragmentValues = Array.isArray((t as any).fragments) ? (t as any).fragments : Object.values(t.fragments ?? {});
		const totalScore = fragmentValues.reduce((acc: number, f: any) => acc + (typeof f?.score === "number" ? f.score : 0), 0);
		return {
			id: t.id,
			name: t.name,
			createdAt: t.createdAt,
			solved: !!t.solved,
			score: totalScore,
		};
	});

	// Sort: solved teams first, then by score descending, then by createdAt ascending
	entries.sort((a, b) => {
		if (a.solved !== b.solved) return a.solved ? -1 : 1;
		if (b.score !== a.score) return b.score - a.score;
		const aTs = Date.parse(a.createdAt ?? "");
		const bTs = Date.parse(b.createdAt ?? "");
		return (isNaN(aTs) ? 0 : aTs) - (isNaN(bTs) ? 0 : bTs);
	});

	return entries;
}
