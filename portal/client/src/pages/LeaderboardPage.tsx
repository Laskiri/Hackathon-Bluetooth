import React, { useEffect, useState } from "react";

type LeaderboardEntry = { id: string; name: string; createdAt: string; solved: boolean; score: number; };

export default function LeaderboardPage() {
	const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/leaderboard")
			.then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
			.then(data => setRows(data))
			.catch(e => setErr(String(e)));
	}, []);

	if (err) return <div>Error loading leaderboard: {err}</div>;
	if (!rows) return <div>Loading leaderboard...</div>;
	if (rows.length === 0) return <div>No teams yet.</div>;

	return (
		<div style={{ padding: 16 }}>
			<h1>Leaderboard</h1>
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr><th>Rank</th><th>Team</th><th style={{ textAlign: "right" }}>Score</th><th>Created</th><th>Solved</th></tr>
				</thead>
				<tbody>
					{rows.map((r, i) => (
						<tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8f8f8" }}>
							<td style={{ padding: 6 }}>{i + 1}</td>
							<td style={{ padding: 6 }}>{r.name}</td>
							<td style={{ padding: 6, textAlign: "right" }}>{r.score}</td>
							<td style={{ padding: 6 }}>{new Date(r.createdAt).toLocaleString()}</td>
							<td style={{ padding: 6 }}>{r.solved ? "Yes" : "No"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
