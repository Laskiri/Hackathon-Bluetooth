const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export async function createTeam(password?: string, fragments?: number) {
  const res = await fetch(`${API_BASE}/api/admin/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, fragments })
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