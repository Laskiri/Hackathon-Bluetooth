import express from "express";
import cors from "cors";
import {
	createTeam,
	getTeam,
	getFragments,
	verifyTeamPassword,
	getLatestTeam,
	findTeamsByName,
	completeRunestone
} from "./db.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = process.env.HOST ?? `http://localhost:${PORT}`;

const app = express();
app.use(cors());
app.use(express.json());

// Admin: create a new team
app.post("/api/admin/teams", async (req, res) => {
	const { password, fragments, name } = req.body ?? {};
	const fragmentsCount = typeof fragments === "number" && fragments >= 1 ? fragments : 2;
	const pass = typeof password === "string" && password.length > 0 ? password : generateRandomPassword(8);
	try {
		const team = await createTeam(pass, fragmentsCount, typeof name === "string" && name.trim().length > 0 ? name.trim() : undefined);
		const baseUrl = HOST;
		const fragmentUrls = Object.keys(team.fragments).map((k) => `${baseUrl}/api/teams/${team.id}/fragments/${k}`);
		res.json({
			teamId: team.id,
			name: team.name,
			password: team.password,
			fragments: team.fragments,
			fragmentUrls
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "failed to create team" });
	}
});

// Resolve friendly team name to team id(s)
app.get("/api/teams/resolve", async (req, res) => {
	const raw = String(req.query.name ?? "").trim();
	if (!raw) return res.status(400).json({ error: "name query parameter required" });

	try {
		const matches = await findTeamsByName(raw);
		if (matches.length === 0) return res.status(404).json({ error: "team not found" });
		if (matches.length === 1) {
			const t = matches[0];
			return res.json({ id: t.id, name: t.name });
		}
		// multiple matches (rare)
		return res.json({
			multiple: true,
			teams: matches.map((t) => ({ id: t.id, name: t.name }))
		});
	} catch (err) {
		console.error("GET /api/teams/resolve error:", err);
		return res.status(500).json({ error: "internal server error" });
	}
});

// Get basic info about a team (no password)
app.get("/api/teams/:teamId", async (req, res) => {
	const team = await getTeam(req.params.teamId);
	if (!team) return res.status(404).json({ error: "not found" });
	res.json({
		id: team.id,
		name: team.name,
		createdAt: team.createdAt,
		solved: team.solved
	});
});

app.get("/api/getLatestTeam", async (req, res) => {
	try {
		const latestTeam = await getLatestTeam();
		if (!latestTeam) return res.status(404).json({ error: "not found" });

		return res.json({
			id: latestTeam.id,
			name: latestTeam.name,
			createdAt: latestTeam.createdAt,
			solved: latestTeam.solved,
		});
	} catch (err) {
		console.error("GET /api/getLatestTeam error:", err);
		return res.status(500).json({ error: "internal server error" });
	}
});

// Return all fragments (admin/debug)
app.get("/api/teams/:teamId/fragments", async (req, res) => {
	const fr = await getFragments(req.params.teamId);
	if (fr == null) return res.status(404).json({ error: "not found" });
	res.json({ fragments: fr });
});

// Return single fragment (for devices)
app.get("/api/teams/:teamId/fragments/:index", async (req, res) => {
	const fr = await getFragments(req.params.teamId);
	if (fr == null) return res.status(404).json({ error: "not found" });
	const idx = String(req.params.index);
	if (!(idx in fr)) {
		return res.status(400).json({ error: "invalid fragment index" });
	}
	res.json({ index: idx, fragment: fr[idx] });
});

// Mark a runestone fragment as completed
app.post("/api/teams/:teamId/runestone/:runestoneId", async (req, res) => {
	const { teamId, runestoneId } = req.params;
	try {
		const update = await completeRunestone(teamId, runestoneId);
		if (!update.ok) return res.status(400).json({ success: false, message: update.message });
		return res.json({ success: true, fragment: update.fragment, team: { id: update.team!.id, solved: update.team!.solved } });
	} catch (err) {
		console.error("POST /api/teams/:teamId/runestone/:runestoneId error:", err);
		return res.status(500).json({ error: "internal server error" });
	}
});

// Verify password
app.post("/api/verify", async (req, res) => {
	const { teamId, password } = req.body ?? {};
	if (!teamId || typeof password !== "string") {
		return res.status(400).json({ success: false, message: "teamId and password required" });
	}
	const result = await verifyTeamPassword(teamId, password);
	if (result.ok) {
		return res.json({ success: true, message: "Correct — congratulations!" });
	} else {
		return res.json({ success: false, message: result.message ?? "Incorrect" });
	}
});

app.get("/api/health", async (req, res) => {
	return res.json({ message: "ok" });
})

app.listen(PORT, () => {
	console.log(`Server running on ${HOST}`);
});

// Helper
function generateRandomPassword(length = 8) {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
	let out = "";
	for (let i = 0; i < length; i++) {
		out += chars[Math.floor(Math.random() * chars.length)];
	}
	return out;
}
