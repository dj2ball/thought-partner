const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function realRun(body: any) {
  const response = await fetch(`${API_BASE}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchRecipes() {
  const response = await fetch(`${API_BASE}/recipes`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  const data = await response.json();
  return data.recipes;
}

export async function saveProfile(profile: any) {
  const response = await fetch(`${API_BASE}/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}