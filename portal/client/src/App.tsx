import React, { useState } from "react";
import { createTeam, getFragments, verifyPassword } from "./api";

export default function App() {
	const [teamCode, setTeamCode] = useState("");
	const [teamId, setTeamId] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [celebrate, setCelebrate] = useState(false);
	const [showAdmin, setShowAdmin] = useState(false);
	const [created, setCreated] = useState<any>(null);
	const [fragmentsData, setFragmentsData] = useState<string[] | null>(null);
	const [name, setTeamName] = useState("");

	// Admin create team
	async function handleCreateTeam(e: React.FormEvent) {
		e.preventDefault();
		const form = new FormData(e.target as HTMLFormElement);
		const password = (form.get("password") as string) || undefined;
		const frag = Number((form.get("fragments") as string) || "3");
		const res = await createTeam(password, frag);
		setCreated(res);
		setTeamId(res.teamId);
		setTeamName(res.name);
		setTeamCode(res.code);
		setFragmentsData(res.fragments);
	}

	async function handleGetFragments() {
		if (!teamId) {
			setMessage("Enter team id (from admin) to fetch fragments.");
			return;
		}
		const res = await getFragments(teamId);
		if (res?.fragments) setFragmentsData(res.fragments);
		else setMessage("Could not fetch fragments.");
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		// If user provided a team code (human-facing), we don't have a mapping from code to id.
		// For simplicity, require teamId. In your event, give teams the teamId (or we can improve later).
		if (!teamId) {
			setMessage("Please enter Team ID (admin provides) or create a team in Admin.");
			return;
		}
		const res = await verifyPassword(teamId, password);
		if (res.success) {
			setCelebrate(true);
			setMessage(null);
		} else {
			setMessage(res.message ?? "Incorrect");
		}
	}

	return (
		<div className="container">
			<h1>Scavenger Hunt — Submit Password</h1>

			{!celebrate ? (
				<>
					<form onSubmit={handleSubmit}>
						<div>
							<label className="small">Team ID (provided by admin)</label><br />
							<input value={teamId} onChange={(e) => setTeamId(e.target.value)} placeholder="team id (UUID)" style={{ width: "100%" }} />
						</div>
						<div style={{ marginTop: 8 }}>
							<label className="small">Assembled password</label><br />
							<input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Type assembled password" style={{ width: "100%" }} />
						</div>
						<div style={{ marginTop: 12 }}>
							<button type="submit">Submit</button>
						</div>
					</form>

					{message && <p className={message.includes("Incorrect") ? "error" : "success"}>{message}</p>}

					<div style={{ marginTop: 18 }}>
						<button className="admin-toggle" onClick={() => setShowAdmin(s => !s)}>
							{showAdmin ? "Hide Admin" : "Show Admin"}
						</button>
					</div>

					{showAdmin && (
						<div style={{ marginTop: 12 }}>
							<h2>Admin - Create Team</h2>
							<form onSubmit={handleCreateTeam}>
								<div>
									<label className="small">Password (optional, leave blank to auto-generate)</label><br />
									<input name="password" placeholder="e.g. SECRET123" style={{ width: "100%" }} />
								</div>
								<div style={{ marginTop: 8 }}>
									<label className="small">Fragments</label><br />
									<input name="fragments" defaultValue="3" style={{ width: "100px" }} />
								</div>
								<div style={{ marginTop: 8 }}>
									<button type="submit">Create Team</button>
								</div>
							</form>

							{created && (
								<div style={{ marginTop: 12 }}>
									<h3>Created</h3>
									<div><strong>Team ID:</strong> <div className="fragment-box">{created.teamId}</div></div>
									<div><strong>Team code (human):</strong> <div className="fragment-box">{created.code}</div></div>
									<div><strong>Password:</strong> <div className="fragment-box">{created.password}</div></div>
									<div style={{ marginTop: 8 }}>
										<strong>Fragments</strong>
										{created.fragments.map((f: string, idx: number) => (
											<div key={idx} className="fragment-box">
												<div className="small">Fragment {idx} — UI or device can fetch:</div>
												<div className="small">{created.fragmentUrls[idx]}</div>
												<div style={{ marginTop: 6 }}><strong>Value:</strong> {f}</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div style={{ marginTop: 12 }}>
								<h3>Other admin actions</h3>
								<div>
									<input placeholder="Team ID to fetch fragments" onChange={(e) => setTeamId(e.target.value)} value={teamId} style={{ width: "100%" }} />
								</div>
								<div style={{ marginTop: 8 }}>
									<button onClick={handleGetFragments}>Fetch Fragments</button>
								</div>
								{fragmentsData && (
									<div style={{ marginTop: 8 }}>
										<h4>Fragments</h4>
										{fragmentsData.map((f, i) => <div key={i} className="fragment-box">#{i}: {f}</div>)}
									</div>
								)}
							</div>
						</div>
					)}
				</>
			) : (
				<Celebrate />
			)}
		</div>
	);
}

function Celebrate() {
	return (
		<div>
			<h2>🎉 Congratulations!</h2>
			<p className="small">You solved the scavenger hunt password. Enjoy the celebration!</p>
			<div style={{ marginTop: 20 }}>
				<img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" alt="celebrate" style={{ maxWidth: "100%" }} />
			</div>
		</div>
	);
}
