import { normalizeTeamName } from "./teamAliases.js";

export const POINTS = {
  WIN: 3,
  DRAW: 2,
  LOSS: 0
};

export function buildLeaderboard(participants, matches) {
  const normalizedMatches = matches
    .filter((match) => match.status === "FINISHED")
    .map((match) => ({
      ...match,
      homeTeam: normalizeTeamName(match.homeTeam),
      awayTeam: normalizeTeamName(match.awayTeam)
    }));

  const rows = participants.map((participant) => {
    const teams = participant.teams.map((team) => normalizeTeamName(team));
    let points = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (const team of teams) {
      for (const match of normalizedMatches) {
        const isHome = match.homeTeam === team;
        const isAway = match.awayTeam === team;

        if (!isHome && !isAway) {
          continue;
        }

        if (match.winner === "DRAW") {
          draws += 1;
          points += POINTS.DRAW;
          continue;
        }

        const teamWon =
          (isHome && match.winner === "HOME_TEAM") ||
          (isAway && match.winner === "AWAY_TEAM");

        if (teamWon) {
          wins += 1;
          points += POINTS.WIN;
        } else {
          losses += 1;
          points += POINTS.LOSS;
        }
      }
    }

    return {
      name: participant.name,
      teams: participant.teams,
      points,
      wins,
      draws,
      losses
    };
  });

  rows.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.name.localeCompare(b.name);
  });

  return rows;
}
