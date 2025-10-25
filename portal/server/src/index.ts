import express from "express";
import cors from "cors";
import { createTeam, getTeam, getFragments, verifyTeamPassword } from "./db.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const HOST = process.env.HOST ?? `http://localhost:${PORT}`;

const app = express();
app.use(cors());
app.use(express.json());

// Admin: create a new team
app.post("/api/admin/teams", async (req, res) => {
	const { password, fragments } = req.body ?? {};
	const fragmentsCount = typeof fragments === "number" && fragments >= 1 ? fragments : 3;
	const pass = typeof password === "string" && password.length > 0 ? password : generateRandomPassword(8);
	try {
		const team = await createTeam(pass, fragmentsCount);
		const baseUrl = HOST;
		const fragmentUrls = team.fragments.map((_, idx) => `${baseUrl}/api/teams/${team.id}/fragments/${idx}`);
		res.json({
			teamId: team.id,
			name: team.name,
			code: team.code,
			password: team.password,
			fragments: team.fragments,
			fragmentUrls
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "failed to create team" });
	}
});

// Get basic info about a team (no password)
app.get("/api/teams/:teamId", async (req, res) => {
	const team = await getTeam(req.params.teamId);
	if (!team) return res.status(404).json({ error: "not found" });
	res.json({
		id: team.id,
		code: team.code,
		name: team.name,
		createdAt: team.createdAt,
		solved: team.solved
	});
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
	const idx = Number(req.params.index);
	if (Number.isNaN(idx) || idx < 0 || idx >= fr.length) {
		return res.status(400).json({ error: "invalid fragment index" });
	}
	res.json({ index: idx, fragment: fr[idx] });
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

app.listen(PORT, '0.0.0.0', () => {
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

