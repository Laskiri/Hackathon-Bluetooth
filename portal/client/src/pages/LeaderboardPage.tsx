import React, { useEffect, useState } from "react";
import { getLeaderboard } from "../api"; // use the helper

type LeaderboardEntry = { id: string; name: string; createdAt: string; solved: boolean; score: number; };

export default function LeaderboardPage() {
	const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);
	const [err, setErr] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		setRows(null);
		setErr(null);
		getLeaderboard()
			.then((data) => {
				if (!mounted) return;
				setRows(data);
			})
			.catch((e) => {
				console.error("Leaderboard fetch error:", e);
				if (!mounted) return;
				setErr(String(e));
				setRows([]);
			});
		return () => { mounted = false; };
	}, []);

	if (err) return <div style={{ padding: 16, color: "red" }}>Error loading leaderboard: {err}</div>;
	if (!rows) return <div style={{ padding: 16 }}>Loading leaderboard…</div>;
	if (rows.length === 0) return <div style={{ padding: 16 }}>No teams yet.</div>;

	return (
		<div style={{ padding: 16 }}>
			<h1>Leaderboard</h1>
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th style={{ textAlign: "left", padding: 6 }}>Rank</th>
						<th style={{ textAlign: "left", padding: 6 }}>Team</th>
						<th style={{ textAlign: "right", padding: 6 }}>Score</th>
						<th style={{ textAlign: "left", padding: 6 }}>Created</th>
						<th style={{ textAlign: "left", padding: 6 }}>Solved</th>
					</tr>
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
