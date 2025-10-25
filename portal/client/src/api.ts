const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function createTeam(password?: string, fragments?: number, name?: string) {
	const res = await fetch(`${API_BASE}/api/admin/teams`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ password, fragments, name })
	});
	return res.json();
}

export async function verifyPassword(teamId: string, password: string) {
	const res = await fetch(`${API_BASE}/api/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ teamId, password })
	});
	return res.json();
}

export async function getFragments(teamId: string) {
	const res = await fetch(`${API_BASE}/api/teams/${teamId}/fragments`);
	return res.json();
}

/**
 * Resolve a friendly team name to a team id (or multiple matches).
 * Returns:
 *  - { id, name } when single match
 *  - { multiple: true, teams: [{ id, name }, ...] } when multiple matches
 *  - null when 404
 */
export async function resolveTeamName(name: string) {
	if (!name || !name.trim()) return null;
	const res = await fetch(`${API_BASE}/api/teams/resolve?name=${encodeURIComponent(name.trim())}`);
	if (res.status === 404) return null;
	if (!res.ok) {
		// surface raw text for debugging in prototype
		const txt = await res.text();
		throw new Error(txt || `resolve failed: ${res.status}`);
	}
	return res.json();
}

//export async function getLeaderboard() {
//	const res = await fetch(`${API_BASE}/api/leaderboard`);
//	if (!res.ok) {
//		const txt = await res.text();
//		throw new Error(txt || `leaderboard fetch failed: ${res.status}`);
//	}
//	return res.json();
//}
export async function getLeaderboard() {
	const res = await fetch(`/api/leaderboard`);
	if (!res.ok) {
		const txt = await res.text();
		throw new Error(txt || `leaderboard fetch failed: ${res.status}`);
	}
	return res.json();
}
