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

let writeLock = Promise.resolve();

async function withWrite<T>(fn: (db: DBSchema) => Promise<T>): Promise<T> {
	// simple linearizing lock to avoid races
	writeLock = writeLock.then(async () => {
		const db = await ensureDb();
		const res = await fn(db);
		await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
		return res;
	});
	return writeLock;
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
	return vikingNames[idx]
}

export async function createTeam(password: string, fragmentsCount = 2): Promise<Team> {
	const team: Team = {
		id: randomUUID(),
		name: makeVikingName(),
		password,
		fragments: splitIntoFragments(password, fragmentsCount),
		createdAt: new Date().toISOString(),
		solved: false
	};
	await withWrite(async (db) => {
		db.teams[team.id] = team;
		return null;
	});
	return team;
}

export async function getTeam(teamId: string): Promise<Team | null> {
	const db = await ensureDb();
	return db.teams[teamId] ?? null;
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
