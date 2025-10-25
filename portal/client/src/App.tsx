import React, { useState, useRef, useEffect } from "react";
import { createTeam, getFragments, verifyPassword, resolveTeamName, getLeaderboard } from "./api";
import LeaderboardRedirect from "./components/LeaderboardRedirect";
import LeaderboardPage from "./pages/LeaderboardPage";


type FragmentShape = {
	pass_fragment: string;
	solved: boolean;
	solvedAt: string;
	score?: number;
	// idx is optional on the client side; fragments are keyed by index in the object
};

type LeaderboardEntry = {
	id: string;
	name: string;
	createdAt: string;
	solved: boolean;
	score: number;
};

export default function App() {
	const [teamId, setTeamId] = useState("");
	const [teamName, setTeamName] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState<string | null>(null);
	const [celebrate, setCelebrate] = useState(false);
	const [showAdmin, setShowAdmin] = useState(false);
	const [created, setCreated] = useState<any>(null);
	const [fragmentsData, setFragmentsData] = useState<Record<string, FragmentShape> | null>(null);


	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
	const [showLeaderboard, setShowLeaderboard] = useState(false);

	// Admin create team
	async function handleCreateTeam(e: React.FormEvent) {
		e.preventDefault();
		const form = new FormData(e.target as HTMLFormElement);
		const password = (form.get("password") as string) || undefined;
		const frag = Number((form.get("fragments") as string) || "3");
		const name = (form.get("name") as string) || undefined;
		const res = await createTeam(password, frag, name);
		setCreated(res);
		setTeamId(res.teamId);
		setTeamName(res.name);
		setFragmentsData(res.fragments ?? null);
	}

	async function handleGetFragments() {
		if (!teamId) {
			setMessage("Enter team id (from admin) to fetch fragments.");
			return;
		}
		const res = await getFragments(teamId);
		if (res?.fragments) {
			setFragmentsData(res.fragments);
		} else {
			setMessage("Could not fetch fragments.");
		}
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setMessage(null);

		let idToUse = "";

		// If an explicit admin-provided teamId is set (e.g., from admin UI), prefer it.
		if (teamId) {
			idToUse = teamId;
		} else if (!teamName) {
			setMessage("Please enter team name (or paste team ID) or create a team in Admin.");
			return;
		} else {
			// Try to resolve the friendly name
			try {
				const resolved = await resolveTeamName(teamName);
				if (!resolved) {
					setMessage("Team not found");
					return;
				}
				if ("multiple" in resolved && resolved.multiple) {
					const first = resolved.teams[0];
					setMessage(`Multiple teams found with that name — using first match: ${first.name}`);
					idToUse = first.id;
				} else {
					idToUse = resolved.id;
				}
			} catch (err: any) {
				console.error("resolveTeamName error:", err);
				setMessage("Failed to resolve team name");
				return;
			}
		}

		// Submit password
		const res = await verifyPassword(idToUse, password);
		if (res.success) {
			setCelebrate(true);
			setMessage(null);
		} else {
			setMessage(res.message ?? "Incorrect");
		}
	}

	// helper to render fragments object in index order
	function renderFragmentsObject(fragObj: Record<string, FragmentShape> | null, fragmentUrls?: string[]) {
		if (!fragObj) return null;
		const keys = Object.keys(fragObj).sort((a, b) => Number(a) - Number(b));
		return (
			<>
				{keys.map((k) => {
					const f = fragObj[k];
					const idx = Number(k);
					return (
						<div key={k} className="fragment-box">
							<div className="small">Fragment {idx} — UI or device can fetch:</div>
							{/* fragmentUrls is an array from server, indexed by numeric order */}
							{fragmentUrls && fragmentUrls[idx] && <div className="small">{fragmentUrls[idx]}</div>}
							<div style={{ marginTop: 6 }}><strong>Value:</strong> {f?.pass_fragment}</div>
							{typeof f?.score === "number" && <div className="small">Score: {f.score}</div>}
							{f?.solved && <div className="small">Solved at: {f.solvedAt}</div>}
						</div>
					);
				})}
			</>
		);
	}

	// inside App component

	async function fetchLeaderboard() {
		setLeaderboard(null);
		setMessage(null);
		try {
			const data = await getLeaderboard();
			setLeaderboard(data);
		} catch (err: any) {
			console.error("fetchLeaderboard error:", err);
			setMessage(err?.message ? `Error loading leaderboard: ${err.message}` : "Error loading leaderboard");
			setLeaderboard([]);
		}
	}

	return (
		<div className="container">
			<h1>Summon Harald Bluetooth</h1>

			<div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
				<button
					onClick={() => {
						const show = !showLeaderboard;
						setShowLeaderboard(show);
						if (show && !leaderboard) fetchLeaderboard();
					}}
				>
					{showLeaderboard ? "Hide Leaderboard" : "Show Leaderboard"}
				</button>
			</div>

			{showLeaderboard ? (
				<LeaderboardPage />
			) : !celebrate ? (
				<>
					<form onSubmit={handleSubmit}>
						<div>
							<label className="small">Team name (or paste Team ID)</label>
							<br />
							<input
								value={teamName}
								onChange={(e) => setTeamName(e.target.value)}
								placeholder="e.g. Harald or paste UUID"
								style={{ width: "100%" }}
							/>
							<div className="small" style={{ marginTop: 6, color: "#666" }}>
								If you were given a UUID by admin, paste it in the Admin field below (or paste here).
							</div>
						</div>

						<div style={{ marginTop: 8 }}>
							<label className="small">Summoning Rite</label>
							<br />
							<input
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Type assembled summoning rite"
								style={{ width: "100%" }}
							/>
						</div>
						<div style={{ marginTop: 12 }}>
							<button type="submit">Bring to life</button>
						</div>
					</form>

					{message && <p className={message.includes("Incorrect") ? "error" : "success"}>{message}</p>}

					<div style={{ marginTop: 18 }}>
						<button className="admin-toggle" onClick={() => setShowAdmin((s) => !s)}>
							{showAdmin ? "Hide Admin" : "Show Admin"}
						</button>
					</div>

					{showAdmin && (
						<div style={{ marginTop: 12 }}>
							<h2>Admin - Create Team</h2>
							<form onSubmit={handleCreateTeam}>
								<div>
									<label className="small">Team name (optional)</label>
									<br />
									<input name="name" placeholder="e.g. Harald (optional)" style={{ width: "100%" }} />
								</div>
								<div style={{ marginTop: 8 }}>
									<label className="small">Summoning Rite (optional, leave blank to auto-generate)</label>
									<br />
									<input name="password" placeholder="e.g. Gorm the Old of Denmark" style={{ width: "100%" }} />
								</div>
								<div style={{ marginTop: 8 }}>
									<label className="small">Fragments</label>
									<br />
									<input name="fragments" defaultValue="2" style={{ width: "100px" }} />
								</div>
								<div style={{ marginTop: 8 }}>
									<button type="submit">Create Team</button>
								</div>
							</form>

							{created && (
								<div style={{ marginTop: 12 }}>
									<h3>Created</h3>
									<div>
										<strong>Team ID:</strong> <div className="fragment-box">{created.teamId}</div>
									</div>
									<div>
										<strong>Team Name: </strong> <div className="fragment-box">{created.name}</div>
									</div>
									<div>
										<strong>Summoning Rite:</strong> <div className="fragment-box">{created.password}</div>
									</div>
									<div style={{ marginTop: 8 }}>{renderFragmentsObject(created.fragments, created.fragmentUrls)}</div>
								</div>
							)}

							<div style={{ marginTop: 12 }}>
								<h3>Other admin actions</h3>
								<div>
									{/* Admin-only field to paste a raw team ID (UUID) to fetch fragments */}
									<input
										placeholder="Team ID to fetch fragments"
										onChange={(e) => setTeamId(e.target.value)}
										value={teamId}
										style={{ width: "100%" }}
									/>
								</div>
								<div style={{ marginTop: 8 }}>
									<button onClick={handleGetFragments}>Fetch Fragments</button>
								</div>
								{fragmentsData && (
									<div style={{ marginTop: 8 }}>
										<h4>Fragments</h4>
										{renderFragmentsObject(fragmentsData)}
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
};

//function Celebrate() {
//	return (
//		<div>
//			<h2>🎉 Congratulations!</h2>
//			<p className="small">Congratulations, you have brought Harald Bluetooth back to life. Praise the King of Denmark!</p>
//			<div style={{ marginTop: 20 }}>
//				<img src="https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif" alt="celebrate" style={{ maxWidth: "100%" }} />
//			</div>
//		</div>
//	);
//}

function Celebrate() {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [isMutedFallback, setIsMutedFallback] = useState<boolean>(false);
	const [userUnmuted, setUserUnmuted] = useState<boolean>(false);

	useEffect(() => {
		const v = videoRef.current;
		if (!v) return;

		// Start with volume up (1.0)
		v.volume = 1.0;
		v.muted = false;

		// Try to autoplay with sound. If blocked, fall back to muted autoplay.
		const tryPlay = async () => {
			try {
				await v.play();
				// played successfully with sound
				setIsMutedFallback(v.muted);
			} catch (err) {
				// autoplay with sound blocked — mute then autoplay
				try {
					v.muted = true;
					await v.play();
					setIsMutedFallback(true);
				} catch (err2) {
					// If even muted autoplay fails, nothing else to do
					console.warn("Autoplay failed even when muted:", err2);
				}
			}
		};

		tryPlay();

		// Cleanup not strictly necessary for video element but keep safe
		return () => {
			// pause when unmounted
			try { v.pause(); } catch (e) { /* ignore */ }
		};
	}, []);

	function handleUnmute() {
		const v = videoRef.current;
		if (!v) return;
		v.muted = false;
		v.volume = 1.0;
		// try to resume playback (some browsers require a user gesture to unmute)
		v.play().catch((e) => {
			console.warn("Failed to play after unmute:", e);
		});
		setUserUnmuted(true);
		setIsMutedFallback(false);
	}

	return (
		<div>
			<h2>🎉 Congratulations!</h2>
			<p className="small">Congratulations, you have brought Harald Bluetooth back to life. Praise the King of Denmark!</p>

			<div style={{ marginTop: 20, position: "relative" }}>
				<video
					ref={videoRef}
					src="/media/celebrate.mp4"
					style={{ maxWidth: "100%", display: "block", borderRadius: 8 }}
					autoPlay
					playsInline
					loop
				// no controls shown by default; user can unmute with the button we provide
				/>

				{/* Show an Unmute button if autoplay fell back to muted and user hasn't unmuted */}
				{(isMutedFallback && !userUnmuted) && (
					<div style={{
						position: "absolute",
						right: 12,
						bottom: 12,
						display: "flex",
						gap: 8
					}}>
						<button
							onClick={handleUnmute}
							style={{
								padding: "8px 10px",
								borderRadius: 6,
								border: "1px solid rgba(0,0,0,0.1)",
								background: "#fff",
								cursor: "pointer",
								boxShadow: "0 2px 6px rgba(0,0,0,0.12)"
							}}
						>
							🔊 Unmute
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

//
//
//
//async function fetchLeaderboard() {
//	try {
//		const data = await getLeaderboard();
//		// data is an array of entries
//		setLeaderboard(data ?? []);
//	} catch (err: any) {
//		console.error("Failed to fetch leaderboard:", err);
//		setMessage("Failed to fetch leaderboard");
//	}
//}
//
