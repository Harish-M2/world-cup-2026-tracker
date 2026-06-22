import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const DEMO_MATCHES_PATH = path.join(rootDir, "data", "demoMatches.json");

export async function getFinishedMatches() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey || isPlaceholderKey(apiKey)) {
    const demoMatches = await readDemoMatches();
    return {
      source: "demo-data",
      matches: demoMatches,
      warning: "FOOTBALL_DATA_API_KEY is missing or placeholder. Using demo results."
    };
  }

  const baseUrl = process.env.FOOTBALL_DATA_BASE_URL || "https://api.football-data.org/v4";
  const competitionCode = process.env.COMPETITION_CODE || "WC";

  const endpoint = `${baseUrl}/competitions/${competitionCode}/matches?status=FINISHED`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        "X-Auth-Token": apiKey
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`football-data API error (${response.status}): ${text}`);
    }

    const json = await response.json();

    const matches = (json.matches || []).map((match) => ({
      id: match.id,
      utcDate: match.utcDate,
      homeTeam: match.homeTeam?.name || "",
      awayTeam: match.awayTeam?.name || "",
      status: match.status,
      winner: match.score?.winner || "DRAW",
      fullTime: {
        home: match.score?.fullTime?.home,
        away: match.score?.fullTime?.away
      }
    }));

    return {
      source: "football-data.org",
      matches,
      warning: null
    };
  } catch (error) {
    const demoMatches = await readDemoMatches();
    return {
      source: "demo-data",
      matches: demoMatches,
      warning: `Live API unavailable (${error.message}). Using demo results.`
    };
  }
}

function isPlaceholderKey(apiKey) {
  return apiKey.trim() === "" || apiKey.includes("your_api_key_here");
}

async function readDemoMatches() {
  const raw = await fs.readFile(DEMO_MATCHES_PATH, "utf-8");
  return JSON.parse(raw);
}
