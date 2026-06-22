import "dotenv/config";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFinishedMatches } from "./matchProvider.js";
import { buildLeaderboard, POINTS } from "./scoring.js";
import { normalizeTeamName } from "./teamAliases.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const app = express();
app.use(express.json());
app.use(express.static(path.join(rootDir, "public")));

const participantsPath = path.join(rootDir, "data", "participants.json");
const tournamentStartDate = parseTournamentStartDate(process.env.WORLD_CUP_START_DATE);

let cachedState = {
  leaderboard: [],
  participants: [],
  recentMatches: [],
  allMatches: [],
  source: "",
  warning: null,
  lastUpdated: null,
  lastError: null
};

app.get("/api/leaderboard", async (_req, res) => {
  if (!cachedState.lastUpdated) {
    await refreshData();
  }
  res.json(cachedState);
});

app.post("/api/refresh", async (_req, res) => {
  try {
    await refreshData();
    res.json(cachedState);
  } catch (error) {
    res.status(500).json({
      message: "Failed to refresh data.",
      error: error.message
    });
  }
});

app.get("/api/matches", (_req, res) => {
  const page = Math.max(1, Number(_req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(_req.query.limit) || 20));
  const allMatches = cachedState.allMatches;
  const total = allMatches.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const matches = allMatches.slice(start, start + limit);

  res.json({
    matches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

const port = Number(process.env.PORT || 3000);
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  app.listen(port, async () => {
    console.log(`World Cup Tracker running at http://localhost:${port}`);
    await refreshData();
    startAutoRefresh();
  });
}

export default app;

async function refreshData() {
  const participants = await loadParticipants();
  const assignedTeams = buildAssignedTeamSet(participants);

  try {
    const { matches, source, warning } = await getFinishedMatches();
    const eligibleMatches = filterEligibleMatches(matches, tournamentStartDate, assignedTeams);

    const leaderboard = buildLeaderboard(participants, eligibleMatches);
    const sortedMatches = eligibleMatches
      .filter((match) => match.status === "FINISHED")
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());
    const recentMatches = sortedMatches.slice(0, 12);

    cachedState = {
      leaderboard,
      participants,
      recentMatches,
      allMatches: sortedMatches,
      source,
      warning,
      lastUpdated: new Date().toISOString(),
      lastError: null
    };
  } catch (error) {
    cachedState = {
      ...cachedState,
      participants,
      warning: "Live refresh failed. Showing the last successful leaderboard.",
      lastError: error.message,
      lastUpdated: new Date().toISOString()
    };

    if (cachedState.leaderboard.length === 0) {
      throw error;
    }
  }
}

function startAutoRefresh() {
  const minutes = Number(process.env.AUTO_REFRESH_MINUTES || 30);
  const intervalMs = Math.max(1, minutes) * 60 * 1000;

  setInterval(async () => {
    try {
      await refreshData();
      console.log(`Auto-refresh successful at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`Auto-refresh failed: ${error.message}`);
    }
  }, intervalMs);
}

async function loadParticipants() {
  const raw = await fs.readFile(participantsPath, "utf-8");
  return JSON.parse(raw);
}

app.get("/api/rules", (_req, res) => {
  res.json({
    points: POINTS,
    description: "Each assigned team earns 3 points for a win, 2 for a draw, and 0 for a loss.",
    resultsCountedFrom: tournamentStartDate.toISOString(),
    teamFilter: "assigned-teams-only"
  });
});

function parseTournamentStartDate(rawDate) {
  const fallback = new Date("2026-06-11T00:00:00Z");

  if (!rawDate) {
    return fallback;
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    console.warn("Invalid WORLD_CUP_START_DATE value. Falling back to 2026-06-11T00:00:00Z.");
    return fallback;
  }

  return parsed;
}

function filterEligibleMatches(matches, startDate, assignedTeams) {
  return matches.filter((match) => {
    if (!match.utcDate) {
      return false;
    }

    const matchDate = new Date(match.utcDate);
    if (Number.isNaN(matchDate.getTime())) {
      return false;
    }

    if (matchDate < startDate) {
      return false;
    }

    const homeTeam = normalizeTeamName(match.homeTeam);
    const awayTeam = normalizeTeamName(match.awayTeam);

    return assignedTeams.has(homeTeam) || assignedTeams.has(awayTeam);
  });
}

function buildAssignedTeamSet(participants) {
  const assignedTeams = new Set();

  for (const participant of participants) {
    for (const team of participant.teams || []) {
      assignedTeams.add(normalizeTeamName(team));
    }
  }

  return assignedTeams;
}
